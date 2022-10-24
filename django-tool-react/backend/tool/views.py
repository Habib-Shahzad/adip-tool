# from django.shortcuts import render
# from rest_framework import viewsets

from django.http import JsonResponse 
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
        image = cv2.blur(image, (5, 5))

    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)


@csrf_exempt 
def underwater_tools_view(request):
    f = request.FILES['upload']
    myfile = f.read()
    image = cv2.imdecode(np.frombuffer(myfile , np.uint8), cv2.IMREAD_COLOR)

    radioValue = int(request.POST['radioValue'])
    if radioValue == 1:
        image = main_CLAHE(image)
    elif radioValue == 2:
        image = main_LabCC(image)


    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)


