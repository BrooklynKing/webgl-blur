let texture;
let swapTexture;

let defaultShader;
let blurShader;
let flipShader;

let gl;
function prepare(canvas, video) {
    const { width, height } = canvas;

    gl = canvas.getContext("webgl");

    if (!gl) {
        return false;
    }

    texture =  new Texture(gl, width, height, gl.RGBA, gl.UNSIGNED_BYTE)
    swapTexture = new Texture(gl, width, height, gl.RGBA, gl.UNSIGNED_BYTE);

    blurShader = Shader.fromScript('blur-fragment-shader', gl);
    flipShader = Shader.fromScript('flip-fragment-shader', gl);
    defaultShader = new Shader(gl);

    blurShader.textures({
        u_texture: 0,
    });

    flipShader.textures({
        u_texture: 0,
    });

    return true;
}

function blur(canvas, video) {
    const { videoHeight: height, videoWidth: width } = video;

    const videoTexture = Texture.fromElement(video, gl);
    videoTexture.use();

    texture.drawTo(function() {
        defaultShader.drawRect();
    });

    simpleShader(blurShader, {
        delta: [100 / width, 0]
    });

    simpleShader(blurShader, {
        delta: [0, 100 / height]
    });

    // finally draw the result to the canvas.
    texture.use();
    flipShader.drawRect();
}

function simpleShader(shader, uniforms, textureIn, textureOut) {
    texture.use();
    swapTexture.drawTo(function() {
        shader.uniforms(uniforms).drawRect();
    });
    swapTexture.swapWith(texture);
}


document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');

    video.addEventListener('loadedmetadata', () => {
        canvas.height = canvas.width *  video.videoHeight / video.videoWidth;
        const flag = prepare(canvas, video);
        flag && start();
    });

    function start() {
        blur(canvas, video);
        setTimeout(start, 1000 / 60);
    }
    
    video.src = 'https://wixmp-01bd43eabd844aac9eab64f5.wixmp.com/videos/output/720p/Highest Peak.mp4';
});