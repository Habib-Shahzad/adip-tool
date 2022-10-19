
import React, { useState } from "react";
import './App.scss';
import './global.scss';
import axios from "axios";
import { Row, Col, Container, ToggleButton, ButtonGroup } from "react-bootstrap";
import { Button } from '@mui/material';

const App = () => {

  const [image, setImage] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const imageChange = event => {
    let reader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].size / 1024 < 6000) {
        reader.readAsDataURL(event.target.files[0]);
        const objectUrl = URL.createObjectURL(event.target.files[0]);
        reader.onload = ((theFile) => {
          var image = new Image();
          image.src = theFile.target.result;
          image.onload = function () {
            setImage(event.target.files[0]);
            setFileUrl(objectUrl);
          };
        });
      } else {
        alert("Size too large. Must be below 6000kb.");
      }
    }
  }


  const [radioValue, setRadioValue] = useState('1');

  const radios = [
    { name: 'Find Contours', value: '1' },
    { name: 'Black & White', value: '2' },
    { name: 'Blur', value: '3' },
  ];


  const makeChanges = async () => {
    setLoading(true);

    var formData = new FormData();
    var imagefile = image;
    formData.append("upload", imagefile);
    formData.append("radioValue", radioValue);

    var response = await axios.post("http://localhost:8000/api/sample/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    var responseData = JSON.parse(response.data);
    var myImageData = responseData.image;

    var newSrc = "data:image/png;base64," + myImageData;

    setFileUrl(newSrc);
    setLoading(false);

  }

  const hiddenFileInput = React.useRef(null);
  const handleClick = event => {
    hiddenFileInput.current.click();
  };


  return (
    <Container style={{ marginTop: '1rem' }} >

      <ButtonGroup>
        {radios.map((radio, idx) => (
          <ToggleButton
            key={idx}
            id={`radio-${idx}`}
            type="radio"
            variant={'outline-primary'}
            name="radio"
            value={radio.value}
            checked={radioValue === radio.value}
            onChange={(e) => setRadioValue(e.currentTarget.value)}
          >
            {radio.name}
          </ToggleButton>
        ))}
      </ButtonGroup>


      <div className="margin-global-top-2" />

      <Row >
        <Col >
          <input type="file"
            onChange={imageChange}
            ref={hiddenFileInput}
            style={{ display: 'none' }}
          />

          <Button disabled={loading} onClick={handleClick} type="button" variant="contained" component="span">
            Upload
          </Button>


          {fileUrl && image &&
            <>
              <div className="margin-global-top-1" />
              <img style={{ width: '30rem' }} src={fileUrl} alt="preview" />
            </>
          }

        </Col>
      </Row>

      <div className="margin-global-top-2" />
      {
        fileUrl &&
        <Button disabled={loading} onClick={makeChanges} type="submit" variant="contained" color="primary">
          Make Changes
        </Button>
      }

    </Container>
  )
}


export default App;