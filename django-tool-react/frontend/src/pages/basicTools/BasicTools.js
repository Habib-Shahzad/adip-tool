
import React, { useState } from "react";
import { BouncyText } from "../../components";
import { Row, Col, Container, ToggleButton, ButtonGroup, Button, Spinner } from "react-bootstrap";
import { useOpenCv } from "../../lib/useOpenCv";
import './BasicTools.css';


const BasicTools = () => {

    const { loaded, cv } = useOpenCv();

    const [fileUrl, setFileUrl] = useState(null);
    const [outputProcessed, setOutputProcessed] = useState(null);
    const [loading, setLoading] = useState(false);

    const imageChange = e => {
        setFileUrl(URL.createObjectURL(e.target.files[0]));
    }

    const [radioValue, setRadioValue] = useState('1');

    const radios = [
        { name: 'Find Contours', value: '1' },
        { name: 'Black & White', value: '2' },
        { name: 'Blur', value: '3' },
    ];


    const makeChanges = async () => {

        setLoading(true);

        const imgElement = document.getElementById("image-input");
        let src = cv.imread(imgElement);

        if (radioValue === '1') {
            let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
            cv.threshold(src, src, 100, 200, cv.THRESH_BINARY);
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            let poly = new cv.MatVector();
            cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
            // approximates each contour to polygon
            for (let i = 0; i < contours.size(); ++i) {
                let tmp = new cv.Mat();
                let cnt = contours.get(i);
                // You can try more different parameters
                cv.approxPolyDP(cnt, tmp, 3, true);
                poly.push_back(tmp);
                cnt.delete(); tmp.delete();
            }
            // draw contours with random Scalar
            for (let i = 0; i < contours.size(); ++i) {
                let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                    Math.round(Math.random() * 255));
                cv.drawContours(dst, poly, i, color, 1, 8, hierarchy, 0);
            }
            cv.imshow('canvasOutput', dst);
            src.delete(); dst.delete(); hierarchy.delete(); contours.delete(); poly.delete();

        }
        else if (radioValue === '2') {
            let dst = new cv.Mat();
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
            cv.imshow('canvasOutput', dst);
            src.delete(); dst.delete();
        }
        else if (radioValue === '3') {
            let dst = new cv.Mat();
            let ksize = new cv.Size(5, 5);
            cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
            cv.imshow('canvasOutput', dst);
            src.delete(); dst.delete();
        }


        setLoading(false);
        setOutputProcessed(true);

    }


    const hiddenFileInput = React.useRef(null);

    const handleClick = event => {
        hiddenFileInput.current.click();
    };

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
                    {
                        fileUrl &&
                        <ButtonGroup>
                            {radios.map((radio, idx) => (
                                <ToggleButton
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

                        </>

                    }
                </Col>

                <Col>
                    <div className='fancy-text-container'>
                        <BouncyText text="Basic image processing" />
                    </div >
                </Col>
            </Row>


            {fileUrl &&
                <>
                    <div className="margin-global-top-2" />
                    <Container>
                        <Row>
                            <Col>
                                <img id="image-input" className="image-preview-container" src={fileUrl} alt="preview" />
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
                                <canvas
                                    id="canvasOutput"
                                    name="canvasOutput"
                                    className="image-preview-container"
                                    style={{ display: (!loading && outputProcessed) ? "block" : "none" }}
                                > </canvas>
                            </Col>
                        </Row>
                    </Container>
                </>
            }



        </Container>
    )
}

export default BasicTools;