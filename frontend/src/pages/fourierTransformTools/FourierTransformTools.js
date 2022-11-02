
/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import axios from "axios";
import { Row, Col, Container, Button, Spinner, Form } from "react-bootstrap";
import './FourierTransformTools.css';
import { useOpenCv } from "../../lib/useOpenCv";
import { BouncyText } from "../../components";

const APP_URL = "http://localhost:8000";
// const APP_URL = "https://adip-tool.herokuapp.com";


const FourierTransform = () => {

    const { loaded, cv } = useOpenCv();

    const [fileUrl, setFileUrl] = useState(null);
    const [inputLoaded, setInputLoaded] = useState(false);
    const [fftLoading, setFftLoading] = useState(false);

    const [dataUrl, setDataUrl] = useState(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [markerSize, setMarkerSize] = useState(25);

    const [outputProcessed, setOutputProcessed] = useState(null);
    const [loading, setLoading] = useState(false);

    const imageChange = e => {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);

        setOutputProcessed(null);

        setFileUrl(imageUrl);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setDataUrl(reader.result);
        }

        const canvas = document.getElementById("fourier-input-canvas");
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.src = imageUrl;

        img.onload = function () {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0, img.width, img.height);
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


    const hiddenFileInput = React.useRef(null);

    const handleClick = event => {
        hiddenFileInput.current.click();
    };



    function getMouesPosition(e, canvas) {
        var mouseX = e.nativeEvent.offsetX * canvas.width / canvas.clientWidth | 0;
        var mouseY = e.nativeEvent.offsetY * canvas.height / canvas.clientHeight | 0;
        return { x: mouseX, y: mouseY };
    }


    const highlightOnCanvas = (e, canvas, context) => {

        const { x, y } = getMouesPosition(e, canvas);

        context.lineTo(x, y);
        context.lineWidth = markerSize;
        context.strokeStyle = 'rgba(0,0,0,1)';
        context.globalCompositeOperation = 'source-over';

        context.beginPath();
        context.arc(x, y, markerSize, 0, Math.PI * 2);
        context.fill();
    }


    const computeInverseFFT = async () => {

        // Processing 
        setFftLoading(true);

        // Get the input image from the canvas
        const canvas = document.getElementById("fourier-canvas");
        var inputImageFile = document.getElementById('fileInput').files[0];

        // Get the image data from the canvas
        var imagefile = new Image();
        imagefile.src = canvas.toDataURL();

        // send the input image and the fft image to the backend
        var formData = new FormData();
        formData.append("upload", dataURLtoFile(canvas.toDataURL(), "image.png"));
        formData.append("input", inputImageFile);

        // Get the response from the backend
        var response = await axios.post(`${APP_URL}/api/inv-fft/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Get the image from the response
        var responseData = JSON.parse(response.data);
        var myImageData = responseData.image;
        var newSrc = "data:image/png;base64," + myImageData;

        const inputCanvas = document.getElementById("fourier-input-canvas");
        const inputCtx = inputCanvas.getContext("2d");

        // Draw the image on the input canvas
        let outputImage = new Image();
        outputImage.src = newSrc;

        outputImage.onload = () => {
            inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
            inputCtx.drawImage(outputImage, 0, 0);
        }

        // Processing done
        setFftLoading(false);
    }

    const computeNormalizedFFT = async () => {

        const inputCanvas = document.getElementById("fourier-input-canvas");
        const inputImage = cv.imread("image-input");
    
        var formData = new FormData();
        formData.append("upload", dataURLtoFile(dataUrl, "image.png"));

        var response = await axios.post(`${APP_URL}/api/fft/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        var responseData = JSON.parse(response.data);
        var myImageData = responseData.image;

        // create a new image element and store the image data
        var outputImge = new Image();
        var newSrc = "data:image/png;base64," + myImageData;
        outputImge.src = newSrc;

        // change the height and width of the output canvas according to input image
        var canvas = document.getElementById('fourier-canvas');
        canvas.width = inputCanvas.width;
        canvas.height = inputCanvas.height;

        // reset the input canvas
        
        const inputCtx = inputCanvas.getContext("2d");
        inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
        cv.imshow("fourier-input-canvas", inputImage);

        // draw the output image on the canvas
        outputImge.onload = function () {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(outputImge, 0, 0);
        }

        // Processing done
        setOutputProcessed(true);
        setLoading(false);


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
                    <input ref={hiddenFileInput} type="file" id="fileInput" name="file" onChange={imageChange} style={{ display: 'none' }} />
                    <div
                        style={
                            {
                                display: 'flex',
                            }
                        }
                    >
                        <Button
                            disabled={loading || fftLoading}
                            onClick={handleClick}
                            type="button"
                            variant="outline-light"
                        >
                            Upload
                        </Button>

                        {
                            fileUrl &&
                            <>
                                <Button
                                    style={{ marginLeft: '2rem' }}
                                    disabled={loading || fftLoading}
                                    onClick={computeNormalizedFFT}
                                    type="submit"
                                    variant="outline-light"
                                >
                                    {outputProcessed ? "Reset" : "Show Output"}
                                </Button>
                            </>
                        }


                        <div
                            style={{
                                backgroundColor: 'transparent',
                                display: (loading || fftLoading) ? 'inline-block' : 'none',
                                marginLeft: '2rem',
                            }}
                            variant="outline-light"
                        >
                            <Spinner
                                style={{ color: 'white', }}
                                animation="border"
                                role="status"
                            >
                            </Spinner>
                        </div>

                    </div>
                </Col>

                <Col>
                    <div className='fancy-text-container'>
                        <BouncyText text="Fun with Frequency domain" />
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
                                id='fourier-input-canvas-container'
                                style={{
                                    marginTop: '4rem',
                                    display: inputLoaded ? 'block' : 'none',
                                }}
                            >

                                <canvas
                                    id="fourier-input-canvas"
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
                                style={{
                                    display: outputProcessed ? 'block' : 'none'
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
                                id='fourier-drawing-container'
                                style={{
                                    display: outputProcessed ? 'block' : 'none',
                                }}
                            >
                                <canvas
                                    id="fourier-canvas"

                                    onMouseDown={e => {
                                        var canvas = document.getElementById('fourier-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(true);
                                        highlightOnCanvas(e, canvas, context);

                                    }}
                                    onMouseMove={e => {

                                        var canvas = document.getElementById('fourier-canvas');
                                        var context = canvas.getContext('2d');
                                        if (isDrawing) {
                                            highlightOnCanvas(e, canvas, context);
                                        }

                                    }}
                                    onMouseUp={e => {
                                        var canvas = document.getElementById('fourier-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(false);
                                        context.beginPath();
                                        computeInverseFFT();
                                    }}

                                    onMouseOut={e => {
                                        var canvas = document.getElementById('fourier-canvas');
                                        var context = canvas.getContext('2d');
                                        setIsDrawing(false);
                                        context.beginPath();
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </>




        </Container>
    )
}

export default FourierTransform;