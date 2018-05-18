class Texture { 
    static fromElement(element, gl) {
        const texture = new Texture(gl, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE);
        texture.loadContentsOf(element);
        return texture;
    };

    constructor(gl, width, height, format, type) {
        this.gl = gl;
        this.id = this.gl.createTexture();
        this.width = width;
        this.height = height;
        this.format = format;
        this.type = type;

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        if (width && height) this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
    }

    loadContentsOf(element) {
        this.width = element.width || element.videoWidth;
        this.height = element.height || element.videoHeight;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, this.format, this.type, element);
    }

    destroy() {
        this.gl.deleteTexture(this.id);
        this.id = null;
    };

    use(unit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    };

    unuse(unit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    };

    drawTo(callback) {
        // start rendering to this texture
        this.gl.framebuffer = this.gl.framebuffer || this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl.framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.id, 0);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('incomplete framebuffer');
        }
        this.gl.viewport(0, 0, this.width, this.height);

        // do the drawing
        callback();

        // stop rendering to this texture
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    };

    swapWith(other) {
        var temp;
        temp = other.id; other.id = this.id; this.id = temp;
        temp = other.width; other.width = this.width; this.width = temp;
        temp = other.height; other.height = this.height; this.height = temp;
        temp = other.format; other.format = this.format; this.format = temp;
    }
}