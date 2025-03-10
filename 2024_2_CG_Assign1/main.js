"use strict";

// Classes
import Shader from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';
import VertexArray from '../_classes/VertexArray.js'
import IndexBuffer from '../_classes/IndexBuffer.js'
import VertexBuffer from '../_classes/VertexBuffer.js';



// Shader
var pyramidVertexShaderSource = `#version 300 es

layout(location=0) in vec4 a_position; 
layout(location=1) in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model; // u_model -> 같은 vertex와 indicies로 다른 모형을 만들기 위해 해당 모형의 변환을 특정하는 model 행렬 추가

out vec4 v_color; // 색상 정보 전달

void main() {
    gl_Position = u_projection * u_view * u_model * a_position; // u_model 행렬을 적용하여 모델 같은 position 정보라도 다른 위치의 모형으로 변환가능
    v_color = a_color; // 프래그먼트 셰이더로 색상 전달
}
`;
var pyramidFragmentShaderSource = `#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

in vec4 v_color; // 버텍스 셰이더에서 받은 색상 정보

void main() {
    outColor = v_color; // v_color를 출력 색상으로 사용
}
`;

const { mat2, mat3, mat4, vec2, vec3, vec4 } = glMatrix;



function main() {
    // Get A WebGL context
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    // Slider
    var rotation = 0;
    webglLessonsUI.setupSlider("#PyramidRotationY", { slide: updateRotateY, min: 0, max: 360, step: 0.1 });
    function updateRotateY(event, ui) {
        rotation = ui.value;
        drawScene();
    }

    // Vertex
    var pyramidPosition = [
        //x,y,z,r,g,b, 색 순서 : 파 초 하 노
        -0.5, 0, 0.0, 0.0, 1.0, 1.0, // vertex1, 하늘색, 0
        0, 0, 0.5, 1.0, 1.0, 0.0, // vertex2, 노란색, 1
        0.5, 0, 0, 0.0, 0.0, 1.0, // vertex3, 파란색, 2
        0, 0, -0.5, 0.0, 1.0, 0.0, // vertex4, 초록색, 3
        0, 0.5, 0, 1, 0.0, 0.0, //vertex5, 빨간색, 4
    ];

    // Indices
    var pyramidIndices = [
        0, 1, 3, // 밑면
        1, 2, 3, // 밑면
        0, 1, 4, // 옆면1
        1, 2, 4, // 옆면2
        2, 3, 4, // 옆면3
        3, 0, 4, // 옆면4
    ];

    // Binding
    let pyramidVA = new VertexArray(gl);
    let pyramidVB = new VertexBuffer(gl, pyramidPosition);
    pyramidVA.AddBuffer(gl,pyramidVB, [3,3], [false,false]);
    let pyramidIB = new IndexBuffer(gl, pyramidIndices, 18);

    // Set Camera
    let eye = [0.625, 0.3, 3.0];
    let up = [0.0, 1.0, 0.0];
    let yaw = -90.0;
    let pitch = 0.0;
    let movespeed = 0.05;
    let turnspeed = 0.0;
    let mainCamera = new Camera(eye, up, yaw, pitch, movespeed, turnspeed);

    let fovRadian = 60.0 * Math.PI / 180;
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let proj = mat4.create();
    mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

    let shader = new Shader(gl, pyramidVertexShaderSource, pyramidFragmentShaderSource);

    pyramidVA.Unbind(gl);
    pyramidVB.Unbind(gl);
    pyramidIB.Unbind(gl);
    shader.Unbind(gl);

    let renderer = new Renderer();
    // Set Background as Black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    drawScene();

    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        renderer.Clear(gl);
        shader.Bind(gl);

        let view = mainCamera.CalculateViewMatrix();
        shader.SetUniformMat4f(gl, "u_view", view);
        shader.SetUniformMat4f(gl, "u_projection", proj);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK); // Back Face Culling

        // 첫 번째 다이아몬드의 위쪽 사각뿔
        let pyramidTop1 = mat4.create();
        mat4.rotateY(pyramidTop1, pyramidTop1, rotation * Math.PI / 180); // 슬라이더를 통해 y축을 기준으로 회전
        shader.SetUniformMat4f(gl, "u_model", pyramidTop1); // 피라미드 행렬을 u_model로 보냄
        renderer.Draw(gl, pyramidVA, pyramidIB, shader); // 그리기

        // 첫 번째 다이아몬드의 아래쪽 사각뿔
        let pyramidBottom1 = mat4.create();
        mat4.scale(pyramidBottom1, pyramidBottom1, [1, -1, -1]); // y축 반전, z축 반전, 상하 반전을 하여 다이아몬드를 만들고 앞뒤 반전을 하여 엇갈리게 하여 영상과 같은 모양을 만듬
        mat4.rotateY(pyramidBottom1, pyramidBottom1, -rotation * Math.PI / 180);
        shader.SetUniformMat4f(gl, "u_model", pyramidBottom1);
        renderer.Draw(gl, pyramidVA, pyramidIB, shader);

        // 두 번째 다이아몬드의 위쪽 사각뿔
        let pyramidTop2 = mat4.create();
        mat4.translate(pyramidTop2, pyramidTop2, [1.5, 0, 0]); // X축으로 1.5만큼 이동
        mat4.scale(pyramidTop2, pyramidTop2, [-1, 1, -1]); // x축과 z축 반전, 좌우, 앞뒤 반전을 하여 back face culling이 유지되며, 영상과 같은 모양을 만듬
        mat4.rotateY(pyramidTop2, pyramidTop2, -rotation * Math.PI / 180);
        shader.SetUniformMat4f(gl, "u_model", pyramidTop2);
        renderer.Draw(gl, pyramidVA, pyramidIB, shader);

        // 두 번째 다이아몬드의 아래쪽 사각뿔
        let pyramidBottom2 = mat4.create();
        mat4.translate(pyramidBottom2, pyramidBottom2, [1.5, 0, 0.0]);
        mat4.scale(pyramidBottom2, pyramidBottom2, [-1, -1, 1]); // x축과 y축 반전, 마찬가지로 back face culling이 유지되며, 영상과 같은 모양을 만듬
        mat4.rotateY(pyramidBottom2, pyramidBottom2, rotation * Math.PI / 180);
        shader.SetUniformMat4f(gl, "u_model", pyramidBottom2);
        renderer.Draw(gl, pyramidVA, pyramidIB, shader);

        pyramidVA.Unbind(gl);
        shader.Unbind(gl);
    }
}

main();