const getShaderCodeFromScript = shaderScript => {
    if (!shaderScript) {
        return null;
    }

    let str = "";
    let k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    return str;
}

const defaultVertexSource = getShaderCodeFromScript(document.getElementById('default-vertex-shader'));
const defaultFragmentSource = getShaderCodeFromScript(document.getElementById('default-fragment-shader'));

class Shader {
    static fromScript(id, gl) {
        const shaderScript = document.getElementById(id);
        const shaderCode = getShaderCodeFromScript(shaderScript);

        if (shaderScript.type == "x-shader/x-fragment") {
            return new Shader(gl, undefined, shaderCode);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            return new Shader(gl, shaderCode, undefined);
        } else {
            return null;
        }
    }

    constructor(gl, vertexSource = defaultVertexSource, fragmentSource = defaultFragmentSource) {
        this.gl = gl;
        this.program = this.gl.createProgram();
        
        this.gl.attachShader(this.program, this.compileSource(this.gl.VERTEX_SHADER, vertexSource));
        this.gl.attachShader(this.program, this.compileSource(this.gl.FRAGMENT_SHADER, fragmentSource));
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw 'link error: ' + this.gl.getProgramInfoLog(this.program);
        }
    }

    compileSource(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw 'compile error: ' + this.gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    destroy() {
        this.gl.deleteProgram(this.program);
        this.program = null;
    };

    uniforms(uniforms) {
        this.gl.useProgram(this.program);

        for (const name in uniforms) {
            if (!uniforms.hasOwnProperty(name)) continue;

            const location = this.gl.getUniformLocation(this.program, name);
            if (location === null) continue; // will be null if the uniform isn't used in the shader

            const value = uniforms[name];
            if (Array.isArray(value)) {
                switch (value.length) {
                    case 1: this.gl.uniform1fv(location, new Float32Array(value)); break;
                    case 2: this.gl.uniform2fv(location, new Float32Array(value)); break;
                    case 3: this.gl.uniform3fv(location, new Float32Array(value)); break;
                    case 4: this.gl.uniform4fv(location, new Float32Array(value)); break;
                    case 9: this.gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                    case 16: this.gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                    default: throw 'dont\'t know how to load uniform "' + name + '" of length ' + value.length;
                }
            } else if (typeof number === 'number') {
                this.gl.uniform1f(location, value);
            } else {
                throw 'attempted to set uniform "' + name + '" to invalid value ' + (value || 'undefined').toString();
            }
        }
        // allow chaining
        return this;
    };

    // textures are uniforms too but for some reason can't be specified by this.gl.uniform1f,
    // even though floating point numbers represent the integers 0 through 7 exactly
    textures(textures) {
        this.gl.useProgram(this.program);

        for (const name in textures) {
            if (!textures.hasOwnProperty(name)) continue;

            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), textures[name]);
        }
        // allow chaining
        return this;
    };

    drawRect(left, top, right, bottom) {
        const viewport = this.gl.getParameter(this.gl.VIEWPORT);

        top = top !== undefined ? (top - viewport[1]) / viewport[3] : 0;
        left = left !== undefined ? (left - viewport[0]) / viewport[2] : 0;
        right = right !== undefined ? (right - viewport[0]) / viewport[2] : 1;
        bottom = bottom !== undefined ? (bottom - viewport[1]) / viewport[3] : 1;

        if (this.vpos_buf == null) {
            this.vpos_buf = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vpos_buf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([ left, top, left, bottom, right, top, right, bottom ]), this.gl.STATIC_DRAW);
        if (this.tpos_buf == null) {
            this.tpos_buf = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tpos_buf);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ]), this.gl.STATIC_DRAW);
        }
        if (this.a_vpos == null) {
            this.a_vpos = this.gl.getAttribLocation(this.program, 'a_vpos');
            this.gl.enableVertexAttribArray(this.a_vpos);
        }
        if (this.a_tpos == null) {
            this.a_tpos = this.gl.getAttribLocation(this.program, 'a_tpos');
            this.gl.enableVertexAttribArray(this.a_tpos);
        }

        this.gl.useProgram(this.program);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vpos_buf);
        this.gl.vertexAttribPointer(this.a_vpos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tpos_buf);
        this.gl.vertexAttribPointer(this.a_tpos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    };
}