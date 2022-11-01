
import React, { useState } from "react";
import { Row, Col, Container, Button, Spinner, Form } from "react-bootstrap";
import { useOpenCv } from "../../lib/useOpenCv";
import axios from "axios";

import './FourierTransformTools.css';

const APP_URL = "http://localhost:8000";


const FourierTransform = () => {

    const { cv, loaded } = useOpenCv();

    const [fileUrl, setFileUrl] = useState(null);
    const [outputProcessed, setOutputProcessed] = useState(null);
    const [loading, setLoading] = useState(false);

    const [markerSize, setMarkerSize] = useState(5);

    const [fftLoading, setFftLoading] = useState(false);


    const imageChange = e => {
        setFileUrl(URL.createObjectURL(e.target.files[0]));
        setOutputProcessed(null);
    }
    const [isDrawing, setIsDrawing] = useState(false);

    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const processFFT = async () => {

        setFftLoading(true);

        const canvas = document.getElementById("canvasOutput");

        var inputImage = document.getElementById('fileInput').files[0];

        var imagefile = new Image();
        imagefile.src = canvas.toDataURL();

        var formData = new FormData();
        formData.append("upload", dataURLtoFile(canvas.toDataURL(), "image.png"));
        formData.append("input", inputImage);

        var response = await axios.post(`${APP_URL}/api/inv-fft/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        var responseData = JSON.parse(response.data);
        var myImageData = responseData.image;

        var newSrc = "data:image/png;base64," + myImageData;
        document.getElementById('image-input-preview').src = newSrc;

        setFftLoading(false);
    }

    const makeChanges = async () => {

        setLoading(true);
        setOutputProcessed(null);

        var formData = new FormData();
        var imagefile = document.getElementById('fileInput').files[0];
        formData.append("upload", imagefile);

        var response = await axios.post(`${APP_URL}/api/fft/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        var responseData = JSON.parse(response.data);
        var myImageData = responseData.image;

        var img = new Image();

        var newSrc = "data:image/png;base64," + myImageData;
        img.src = newSrc;

        const image = cv.imread("image-input");

        document.getElementById('image-input-preview').src = document.getElementById('image-input').src;

        var canvas = document.getElementById('canvasOutput');

        canvas.width = image.cols;
        canvas.height = image.rows;

        img.onload = function () {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        }
        setOutputProcessed(true);
        setLoading(false);
    }


    const hiddenFileInput = React.useRef(null);

    const handleClick = event => {
        hiddenFileInput.current.click();
    };


    function getMouse(e, canvas) {
        var rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
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
            <div className="margin-global-top-2" />

            <input ref={hiddenFileInput} type="file" id="fileInput" name="file" onChange={imageChange} style={{ display: 'none' }} />

            <div
                style={
                    {
                        display: 'flex',
                    }
                }
            >
                <Button
                    disabled={loading}
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
                            disabled={loading}
                            onClick={makeChanges}
                            type="submit"
                            variant="outline-light"
                        >
                            Show Output
                        </Button>
                        {
                            outputProcessed &&
                            <Button
                                style={{ marginLeft: '2rem' }}
                                disabled={loading}
                                onClick={processFFT}
                                type="submit"
                                variant="outline-light"
                            >
                                Process
                            </Button>
                        }


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


            {fileUrl &&
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

                                <img
                                    id="image-input-preview"
                                    className="image-preview-container"
                                    src={fileUrl}
                                    alt="preview"
                                />
                            </Col>
                            <Col>
                                {outputProcessed &&
                                    <>
                                        <Form.Label
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            Marker Size: {markerSize}
                                        </Form.Label>
                                        <Form.Range
                                            min="5" max="40" step="5"
                                            onChange={(e) => setMarkerSize(e.target.value)}
                                            defaultValue={markerSize}
                                        /></>
                                }
                                <canvas
                                    id="canvasOutput"
                                    name="canvasOutput"
                                    style={{ display: (!loading && outputProcessed) ? "block" : "none" }}
                                    onMouseDown={e => {
                                        const canvas = document.getElementById("canvasOutput");
                                        var ctx = canvas.getContext('2d');
                                        setIsDrawing(true);
                                        var pos = getMouse(e, canvas);
                                        ctx.beginPath();
                                        ctx.lineWidth = markerSize;
                                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                                        ctx.globalCompositeOperation = 'source-over';
                                        ctx.lineJoin = ctx.lineCap = 'round';
                                        ctx.moveTo(pos.x, pos.y);

                                        ctx.lineTo(pos.x, pos.y);
                                        ctx.stroke();
                                    }}
                                    onMouseMove={e => {

                                        if (!isDrawing) return;
                                        const canvas = document.getElementById("canvasOutput");
                                        var ctx = canvas.getContext('2d');

                                        var pos = getMouse(e, canvas);
                                        ctx.lineTo(pos.x, pos.y);
                                        ctx.stroke();
                                    }}
                                    onMouseUp={e => {
                                        setIsDrawing(false);
                                    }}
                                    onMouseOut={e => {
                                        setIsDrawing(false);
                                    }}

                                > </canvas>

                            </Col>
                        </Row>
                    </Container>
                </>
            }



        </Container>
    )
}


export default FourierTransform;