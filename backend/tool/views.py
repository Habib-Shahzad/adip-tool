# from django.shortcuts import render
# from rest_framework import viewsets

from django.http import JsonResponse, HttpResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
import cv2
import numpy as np
import json
import base64
from .clahe import main_CLAHE
from .labcc import main_LabCC


def threshold_image(image):
    img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(img_gray, 150, 255, cv2.THRESH_BINARY)
    return thresh

def draw_image_contours_using_opencv(image):
    '''
    REFERENCED FROM:
    https://learnopencv.com/contour-detection-using-opencv-python-c/
    '''
    thresh = threshold_image(image)
    contours, hierarchy = cv2.findContours(image=thresh,
                                           mode=cv2.RETR_TREE,
                                           method=cv2.CHAIN_APPROX_NONE)
    image_copy = image.copy()
    cv2.drawContours(image=image_copy,
                     contours=contours,
                     contourIdx=-1,
                     color=(0, 255, 0),
                     thickness=2,
                     lineType=cv2.LINE_AA)
    return image_copy

@csrf_exempt
def basic_tools_view(request):
    f = request.FILES['upload']
    myfile = f.read()
    image = cv2.imdecode(np.frombuffer(myfile , np.uint8), cv2.IMREAD_COLOR)

    radioValue = int(request.POST['radioValue'])
    if radioValue == 1:
        image = draw_image_contours_using_opencv(image)
    elif radioValue == 2:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    elif radioValue == 3:
        image = cv2.blur(image, (5, 5))

    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)



@csrf_exempt
def compute_inv_fft(request):
    f = request.FILES['upload']
    f2 = request.FILES['input']

    myfile = f.read()
    f_normalized = cv2.imdecode(np.frombuffer(myfile , np.uint8), cv2.IMREAD_GRAYSCALE)

    input_image = f2.read()
    input_image = cv2.imdecode(np.frombuffer(input_image , np.uint8), cv2.IMREAD_COLOR)

    ycrcb_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2YCrCb)
    y_channel = ycrcb_image[:, :, 0]
    cr_channel = ycrcb_image[:, :, 1]
    cb_channel = ycrcb_image[:, :, 2]

    input_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2GRAY)

    f = np.fft.fft2(y_channel)

    H = f.shape[0]
    W = f.shape[1]
    hW = int (W/2)
    hH = int (H/2)

    for i in range(H):
        for j in (range(W)):
            L = f_normalized[i, j]
            x,y = 0,0

            if(j>=0 and j<hW and i>=0 and i<hH):
                x = j + hW
                y = i + hH
            #Quadrant 1 values mapped to Quadrant 2
            if (j >= hW and j < W and i >= 0 and i < hH):
                x = j - hW
                y = i + hH

            #Quadrant 2 values mapped to Quadrant 1
            if (j >= 0 and j < hW and i >= hH and i < H):
                x = j + hW
                y = i - hH

            #Quadrant 3 values mapped to Quadrant 0
            if (j >= hW and j < W and i >= hH and i < H):
                x = j - hW
                y = i - hH

            if (L == 0):
                f[y,x] = 0+0j

    fshift = np.fft.fftshift(f)
    inverse = np.fft.ifft2(fshift)
    inverse_normalized = np.abs(inverse)

    merged = cv2.merge([inverse_normalized.astype(np.uint8), cr_channel, cb_channel])
    image = cv2.cvtColor(merged, cv2.COLOR_YCrCb2BGR)

    _, imdata = cv2.imencode('.JPG', image )
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)

@csrf_exempt
def compute_fft(request):

    def FFTPlot(Output: np.ndarray):
        FourierMagnitude = np.abs(Output)
        FFTLog = np.log(1 + FourierMagnitude)
        FFTNormalized = (FFTLog / (np.max(FFTLog))) * 255
        FFTNormalized = np.uint8(FFTNormalized)
        return FFTNormalized

    f = request.FILES['upload']
    myfile = f.read()
    image = cv2.imdecode(np.frombuffer(myfile , np.uint8), cv2.IMREAD_COLOR)

    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    f = np.fft.fft2(image)
    fshift = np.fft.fftshift(f)

    spectrum = FFTPlot(fshift)
    _, imdata = cv2.imencode('.JPG', spectrum)

    jstr = json.dumps({
        "image": base64.b64encode(imdata).decode('ascii')
        })
    return JsonResponse(jstr, safe=False)



@csrf_exempt
def brush_view(request):
    empty_canvas = request.FILES['upload']
    input_image = request.FILES['input']

    input_image = input_image.read()
    empty_canvas = empty_canvas.read()

    input_image = cv2.imdecode(np.frombuffer(input_image , np.uint8), cv2.IMREAD_COLOR)
    empty_canvas = cv2.imdecode(np.frombuffer(empty_canvas , np.uint8), cv2.IMREAD_GRAYSCALE)

    image = input_image

    result = np.where(empty_canvas == 255)
    brushed_coordinates = list(zip(result[0], result[1]))

    for x,y in brushed_coordinates :
        r,_,_ = image[x,y]
        image[x,y] = np.array([r,r,r])


    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)



@csrf_exempt
def algorithmic_tools_view(request: HttpRequest):

    empty_canvas = request.FILES['upload']
    input_image = request.FILES['input']
    radio_value = request.POST.get('radioValue')

    input_image = input_image.read()
    empty_canvas = empty_canvas.read()

    input_image = cv2.imdecode(np.frombuffer(input_image , np.uint8), cv2.IMREAD_COLOR)
    empty_canvas = cv2.imdecode(np.frombuffer(empty_canvas , np.uint8), cv2.IMREAD_GRAYSCALE)

    image = input_image

    result = np.where(empty_canvas == 255)

    brushed_coordinates = np.array(list(zip(result[0], result[1])))
    
    coordinates_cookie = request.COOKIES.get('computed_coordinates')
    intersected_coordinates = brushed_coordinates

    if coordinates_cookie is not None:
        computed_coordinates = json.loads(coordinates_cookie)
        intersected_coordinates = np.intersect1d(brushed_coordinates, computed_coordinates)

    if radio_value == '1':
        image = main_CLAHE(image, intersected_coordinates)
    if radio_value == '2':
        image = main_LabCC(image, intersected_coordinates)

    stringified = np.array2string(intersected_coordinates, separator=',')
    response = HttpResponse('hello')
    response.set_cookie('computed_coordinates', stringified)

    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)