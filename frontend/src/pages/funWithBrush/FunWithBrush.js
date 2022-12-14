/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import axios from "axios";
import { Row, Col, Container, ToggleButton, ButtonGroup, Button, Spinner, Form } from "react-bootstrap";
import './FunWithBrush.css';
import { useOpenCv } from "../../lib/useOpenCv";
import { BouncyText } from "../../components";

const APP_URL = "http://localhost:8000";
// const APP_URL = "https://adip-tool.herokuapp.com";


const FunWithBrush = () => {

    const { loaded, cv } = useOpenCv();

    const [fileUrl, setFileUrl] = useState(null);
    const [inputLoaded, setInputLoaded] = useState(false);

    const [dataUrl, setDataUrl] = useState(null);

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
            setDataUrl(reader.result);
        }

        const canvas = document.getElementById("drawing-canvas");
        const ctx = canvas.getContext("2d");

        const hiddenCanvas = document.getElementById("hidden-drawing-canvas");
        const hiddenCtx = hiddenCanvas.getContext("2d");

        const img = new Image();
        img.src = imageUrl;

        img.onload = function () {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            hiddenCanvas.height = img.height;
            hiddenCanvas.width = img.width;
            hiddenCtx.fillStyle = "white";

            setInputLoaded(true);
        }

    }


    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const makeChanges = async () => {

        var formData = new FormData();

        var myInputImage = document.getElementById('fileInput').files[0];
        formData.append("input", myInputImage);

        const hiddenCanvas = document.getElementById("hidden-drawing-canvas");

        formData.append("upload", dataURLtoFile(hiddenCanvas.toDataURL(), "image.png"));
        formData.append("input", myInputImage);

        var response = await axios.post(`${APP_URL}/api/brush-things/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        var responseData = JSON.parse(response.data);
        var myImageData = responseData.image;


        var newSrc = "data:image/png;base64," + myImageData;

        let outputImage = new Image();
        outputImage.src = newSrc;

        const canvas = document.getElementById("output-canvas");

        const inputImage = cv.imread("image-input");

        canvas.width = inputImage.cols;
        canvas.height = inputImage.rows;

        outputImage.onload = () => {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(outputImage, 0, 0);
        }

        setLoading(false);
        setOutputProcessed(true);

    }


    const getRGB = (img, x, y) => {
        let r = img.data[y * img.cols * img.channels() + x * img.channels()];
        let g = img.data[y * img.cols * img.channels() + x * img.channels() + 1];
        let b = img.data[y * img.cols * img.channels() + x * img.channels() + 2];
        return { r, g, b };
    }


    const makeChangesJS = async () => {

        setLoading(true);

        var formData = new FormData();

        var myInputImage = document.getElementById('fileInput').files[0];
        formData.append("input", myInputImage);

        const hiddenCanvas = document.getElementById("hidden-drawing-canvas");


        const canvasImage = cv.imread(hiddenCanvas);

        const inputImage = cv.imread("image-input");
        const outputMat = inputImage.clone();

        for (let i = 0; i < canvasImage.rows; i++) {
            for (let j = 0; j < canvasImage.cols; j++) {
                
                const { r, g, b } = getRGB(canvasImage, j, i);
                const imagePixel = getRGB(inputImage, j, i); 

                if (r === 255 && g === 255 && b === 255) {                    
                    outputMat.ucharPtr(i, j)[0] = imagePixel.r;
                    outputMat.ucharPtr(i, j)[1] = imagePixel.r;
                    outputMat.ucharPtr(i, j)[2] = imagePixel.r;
                    outputMat.ucharPtr(i, j)[3] = 255;
                }
                
            }
        }


        const canvas = document.getElementById("output-canvas");
        
        canvas.width = inputImage.cols;
        canvas.height = inputImage.rows;


        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        cv.imshow(canvas, outputMat);

        setLoading(false);
        setOutputProcessed(true);

    }

    const hiddenFileInput = React.useRef(null);

    const handleClick = event => {
        hiddenFileInput.current.click();
    };


    const resetCanvas = () => {
        const canvas = document.getElementById("drawing-canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hiddenCanvas = document.getElementById("hidden-drawing-canvas");
        const hiddenCtx = hiddenCanvas.getContext("2d");
        hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

        const outputCanvas = document.getElementById("output-canvas");
        const outputCtx = outputCanvas.getContext("2d");
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        const image = new Image();
        image.src = fileUrl;
        image.onload = function () {
            ctx.drawImage(image, 0, 0, image.width, image.height);
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


        const hiddenCanvas = document.getElementById("hidden-drawing-canvas");
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
                            {/* <Button
                                style={{ marginLeft: '2rem' }}
                                disabled={loading || !inputLoaded}
                                // onClick={makeChanges}
                                onClick={makeChangesJS}
                                type="submit"
                                variant="outline-light"
                            >
                                Show Output
                            </Button> */}

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
                        <BouncyText text="Fun With Brush" />
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
                                id='drawing-canvas-container'
                                style={{
                                    display: inputLoaded ? 'block' : 'none',
                                }}
                            >

                                <canvas
                                    id='hidden-drawing-canvas'
                                    style={{
                                        display: 'none'
                                    }}
                                />

                                <canvas
                                    id="drawing-canvas"
                                    onMouseDown={e => {
                                        var canvas = document.getElementById('drawing-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(true);
                                        highlightOnCanvas(e, canvas, context);

                                    }}
                                    onMouseMove={e => {

                                        var canvas = document.getElementById('drawing-canvas');
                                        var context = canvas.getContext('2d');
                                        if (isDrawing) {
                                            highlightOnCanvas(e, canvas, context);
                                        }

                                    }}
                                    onMouseUp={e => {
                                        var canvas = document.getElementById('drawing-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(false);
                                        context.beginPath();
                                        makeChangesJS();
                                    }}

                                    onMouseOut={e => {
                                        var canvas = document.getElementById('drawing-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(false);
                                        context.beginPath();
                                    }}
                                />
                            </div>

                        </Col>
                        <Col>
                            {loading &&
                                <div
                                    style={{ color: 'white', marginTop: '2rem' }}
                                    className="justify-content-center align-items-center"
                                >
                                    <Spinner
                                        animation="border"
                                        role="status"
                                        style={{
                                            width: "4rem",
                                            height: "4rem",
                                            display: loading ? "block" : "none"
                                        }}
                                    >
                                    </Spinner>

                                </div>
                            }

                            <div
                                id='output-canvas-container'
                                style={{
                                    marginTop: '4rem',
                                    display: outputProcessed ? 'block' : 'none',
                                }}
                            >
                                <canvas
                                    id="output-canvas"
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </>




        </Container>
    )
}

export default FunWithBrush;