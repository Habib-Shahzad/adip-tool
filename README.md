# The ultimate tool for image processing

A configurable open source tool using python as a backend and react as a frontend to proces images. 

## Features

- Edit the frequency domain of an image with a brush and visualize realtime changes to the image
- Apply different algorithms on a specific area of an image using a brush
- Use different opencv operations on an image

## Setup

The first thing to do is to clone the repository:

```sh
https://github.com/Habib-Shahzad/adip-tool.git
cd adip-tool
```

`Open two terminals (one for frontend and one for backend)`
## Starting the front-end
Go to the frontend directory
```sh
cd frontend
```
Install the dependent packages:
#### `npm install`
_skip this command, if packages already installed_

run the following command in a terminal to start the front-end:
#### `npm start`
It runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.


## Starting the back-end
Go to the backend directory
```sh
cd backend
```
Install the dependecies (required python packages):
#### `pip install -r requirements.txt`

run the following command in a terminal to start the back-end:
#### `python manage.py runserver`

## Configuring the back-end
#### Adding a url
Open the file [`"backend/backend/urls.py"`](backend/backend/urls.py)
and add a url in the following format
```py
path('api-url', function_to_be_called)
```
#### Adding/Editing a view
Open the file [`"backend/tool/views.py"`](backend/tool/views.py)
and add a view (function that takes request as parameter) that processes the request and returns a response.
Configure other views in this file as seen fit.


## Configuring the front-end
Open the file [`"frontend/index.js"`](frontend/index.js)
and configure accordingly.

