/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import axios from "axios";
import { Row, Col, Container, ToggleButton, ButtonGroup, Button, Spinner, Form } from "react-bootstrap";
import './AlgorithmTools.css';
import { useOpenCv } from "../../lib/useOpenCv";
import { BouncyText } from "../../components";

const APP_URL = "http://localhost:8000";
// const APP_URL = "https://adip-tool.herokuapp.com";


const AlgorithmTools = () => {

    const { loaded, cv } = useOpenCv();

    const [fileUrl, setFileUrl] = useState(null);
    const [inputLoaded, setInputLoaded] = useState(false);
    const [inputDataUrl, setInputDataUrl] = useState(null);


    function drawImageScaled(img, ctx) {
        var canvas = ctx.canvas;
        var hRatio = canvas.width / img.width;
        var vRatio = canvas.height / img.height;
        var ratio = Math.min(hRatio, vRatio);
        var centerShift_x = (canvas.width - img.width * ratio) / 2;
        var centerShift_y = (canvas.height - img.height * ratio) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    }

    const [isDrawing, setIsDrawing] = useState(false);
    const [markerSize, setMarkerSize] = useState(25);

    const [outputProcessed, setOutputProcessed] = useState(null);
    const [loading, setLoading] = useState(false);

    const imageChange = e => {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);

        setFileUrl(imageUrl);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setInputDataUrl(reader.result);
        }

        const canvas = document.getElementById("algorithmic-input-canvas");
        const ctx = canvas.getContext("2d");

        const hiddenCanvas = document.getElementById("hidden-algorithmic-input-canvas");
        const hiddenCtx = hiddenCanvas.getContext("2d");

        const img = new Image();
        img.src = imageUrl;

        canvas.height = 1000;
        canvas.width = 1000;

        hiddenCanvas.height = 1000;
        hiddenCanvas.width = 1000;

        img.onload = function () {
            drawImageScaled(img, ctx);
            hiddenCtx.fillStyle = "white";
            setInputLoaded(true);
        }

    }

    const [radioValue, setRadioValue] = useState('1');

    const radios = [
        { name: 'CLAHE', value: '1' },
        { name: 'Lab Color Correction', value: '2' },
    ];

    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const cropCanvas = (sourceCanvas, left, top, width, height) => {
        let destCanvas = document.createElement('canvas');
        destCanvas.width = width;
        destCanvas.height = height;
        destCanvas.getContext("2d").drawImage(
            sourceCanvas,
            left,
            top,
            width,
            height,
            0,
            0,
            width,
            height);
        return destCanvas;
    }

    const cropTheCanvas = (ctx, img) => {
        var canvas = ctx.canvas;
        var hRatio = canvas.width / img.width;
        var vRatio = canvas.height / img.height;
        var ratio = Math.min(hRatio, vRatio);
        var centerShift_x = (canvas.width - img.width * ratio) / 2;
        var centerShift_y = (canvas.height - img.height * ratio) / 2;
        return cropCanvas(canvas, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    }

    const makeChanges = async () => {

        setLoading(true);
        const hiddenCanvas = document.getElementById("hidden-algorithmic-input-canvas");
        const hiddenCtx = hiddenCanvas.getContext("2d");
        const inputImageElement = document.getElementById('image-input');

        const croppedCanvas = cropTheCanvas(hiddenCtx, inputImageElement);

        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = inputImageElement.width;
        bufferCanvas.height = inputImageElement.height;

        const croppedImage = new Image();
        croppedImage.src = croppedCanvas.toDataURL();

        croppedImage.onload = async () => {
            drawImageScaled(croppedImage, bufferCanvas.getContext("2d"));

            const inputImageFile = document.getElementById('fileInput').files[0];

            var formData = new FormData();

            formData.append("upload", dataURLtoFile(bufferCanvas.toDataURL(), "image.png"));
            formData.append("input", inputImageFile);
            formData.append("radioValue", radioValue);


            var response = await axios.post(`${APP_URL}/api/algorithmic-tools/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            var responseData = JSON.parse(response.data);
            var myImageData = responseData.image;
            var newSrc = "data:image/png;base64," + myImageData;

            let outputImage = new Image();
            outputImage.src = newSrc;

            const outputCanvas = document.getElementById("algorithmic-output-canvas");

            outputCanvas.width = 1000;
            outputCanvas.height = 1000;

            outputImage.onload = () => {
                var outputCtx = outputCanvas.getContext('2d');
                outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                drawImageScaled(outputImage, outputCtx);
            }

            setLoading(false);
            setOutputProcessed(true);

        }
    }

    const hiddenFileInput = React.useRef(null);

    const handleClick = event => {
        hiddenFileInput.current.click();
    };


    const resetCanvas = () => {
        const canvas = document.getElementById("algorithmic-input-canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hiddenCanvas = document.getElementById("hidden-algorithmic-input-canvas");
        const hiddenCtx = hiddenCanvas.getContext("2d");
        hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

        const outputCanvas = document.getElementById("algorithmic-output-canvas");
        const outputCtx = outputCanvas.getContext("2d");
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        const image = new Image();
        image.src = fileUrl;

        canvas.height = 1000;
        canvas.width = 1000;

        image.onload = function () {
            drawImageScaled(image, ctx);
        }
    }



    function getMouesPosition(e, canvas) {
        var mouseX = e.nativeEvent.offsetX * canvas.width / canvas.clientWidth | 0;
        var mouseY = e.nativeEvent.offsetY * canvas.height / canvas.clientHeight | 0;
        return { x: mouseX, y: mouseY };
    }


    const highlightOnCanvas = (e, canvas, context) => {

        const { x, y } = getMouesPosition(e, canvas);

        context.lineTo(x, y);
        context.lineWidth = markerSize;
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = "#ff0";

        context.beginPath();
        context.arc(x, y, markerSize, 0, Math.PI * 2);
        context.fill();

        const hiddenCanvas = document.getElementById("hidden-algorithmic-input-canvas");
        const hiddenCtx = hiddenCanvas.getContext("2d");


        hiddenCtx.lineTo(x, y);
        hiddenCtx.lineWidth = markerSize;
        hiddenCtx.strokeStyle = 'rgba(0,0,0,1)';
        hiddenCtx.globalCompositeOperation = 'source-over';

        hiddenCtx.beginPath();
        hiddenCtx.arc(x, y, markerSize, 0, Math.PI * 2);
        hiddenCtx.fill();
    }


    if (!loaded) {
        return (
            <Container style={{ marginTop: '1rem' }}>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <Spinner style={{ color: 'white' }} animation="border" role="status">
                        </Spinner>
                    </Col>
                </Row>
            </Container>
        );
    }


    return (
        <Container >

            <div className="margin-global-top-2" />

            <Row>
                <Col
                    md={4}
                >

                    <div
                        style={{
                            display: 'flex',
                        }}
                    >
                        {
                            inputLoaded &&
                            <ButtonGroup
                                disabled={loading}
                            >
                                {radios.map((radio, idx) => (
                                    <ToggleButton
                                        disabled={loading}
                                        key={idx}
                                        id={`radio-${idx}`}
                                        type="radio"
                                        variant={'outline-light'}
                                        name="radio"
                                        value={radio.value}
                                        checked={radioValue === radio.value}
                                        onChange={(e) => setRadioValue(e.currentTarget.value)}
                                    >
                                        {radio.name}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        }

                        <div
                            style={{
                                marginLeft: '2rem'
                            }}
                        >
                            <Spinner
                                style={{ color: 'white' }}
                                animation="border"
                                role="status"
                                hidden={!loading}
                            />
                        </div>

                    </div>

                    <div className="margin-global-top-2" />

                    <input ref={hiddenFileInput} type="file" id="fileInput" name="file" onChange={imageChange} style={{ display: 'none' }} />

                    <Button
                        disabled={loading}
                        onClick={handleClick}
                        type="button"
                        variant="outline-light"
                    >
                        Upload
                    </Button>

                    {
                        inputLoaded &&
                        <>
                            <Button
                                style={{ marginLeft: '2rem' }}
                                disabled={loading}
                                onClick={makeChanges}
                                type="submit"
                                variant="outline-light"
                            >
                                Show Output
                            </Button>

                            <Button
                                style={{ marginLeft: '2rem' }}
                                disabled={loading}
                                onClick={resetCanvas}
                                type="submit"
                                variant="outline-light"
                            >
                                Reset
                            </Button>

                        </>
                    }
                </Col>

                <Col>
                    <div className='fancy-text-container'>
                        <BouncyText text="Algorithmic Image Processing" />
                    </div >
                </Col>
            </Row>



            <>
                <div className="margin-global-top-2" />
                <Container>
                    <Row>
                        <Col>

                            <img
                                id="image-input"
                                style={{ display: 'none' }}
                                src={fileUrl}
                                alt="preview"
                            />

                            <div
                                style={{
                                    display: inputLoaded ? 'block' : 'none'
                                }}
                            >
                                <Form.Label
                                    style={{
                                        color: 'white',
                                    }}
                                >
                                    Marker Size: {markerSize}
                                </Form.Label>
                                <Form.Range
                                    min="5" max="50" step="1"
                                    onChange={(e) => setMarkerSize(e.target.value)}
                                    defaultValue={markerSize}
                                />
                            </div>

                            <div
                                id='algorithmic-input-canvas-container'
                                style={{
                                    display: inputLoaded ? 'block' : 'none',
                                }}
                            >

                                <canvas
                                    id='hidden-algorithmic-input-canvas'
                                    style={{
                                        display: 'none',
                                        border: '5px solid white'
                                    }}
                                />

                                <canvas
                                    id="algorithmic-input-canvas"
                                    onMouseDown={e => {
                                        var canvas = document.getElementById('algorithmic-input-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(true);
                                        highlightOnCanvas(e, canvas, context);

                                    }}
                                    onMouseMove={e => {

                                        var canvas = document.getElementById('algorithmic-input-canvas');
                                        var context = canvas.getContext('2d');
                                        if (isDrawing) {
                                            highlightOnCanvas(e, canvas, context);
                                        }

                                    }}
                                    onMouseUp={e => {
                                        var canvas = document.getElementById('algorithmic-input-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(false);
                                        context.beginPath();
                                    }}

                                    onMouseOut={e => {
                                        var canvas = document.getElementById('algorithmic-input-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(false);
                                        context.beginPath();
                                    }}
                                />
                            </div>

                        </Col>
                        <Col>
                            <div
                                id='algorithmic-output-canvas-container'
                                style={{
                                    marginTop: '4rem',
                                    display: outputProcessed ? 'block' : 'none',
                                }}
                            >
                                <canvas
                                    id="algorithmic-output-canvas"
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </>




        </Container>
    )
}

export default AlgorithmTools;