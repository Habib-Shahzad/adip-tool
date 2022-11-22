from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
import cv2
import numpy as np
import json
import base64
from .clahe import main_CLAHE
from .labcc import main_LabCC
from typing import Callable


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
    image = cv2.imdecode(np.frombuffer(myfile, np.uint8), cv2.IMREAD_COLOR)

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
    f_normalized = cv2.imdecode(np.frombuffer(myfile, np.uint8),
                                cv2.IMREAD_GRAYSCALE)

    input_image = f2.read()
    input_image = cv2.imdecode(np.frombuffer(input_image, np.uint8),
                               cv2.IMREAD_COLOR)

    ycrcb_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2YCrCb)
    y_channel = ycrcb_image[:, :, 0]
    cr_channel = ycrcb_image[:, :, 1]
    cb_channel = ycrcb_image[:, :, 2]

    input_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2GRAY)

    f = np.fft.fft2(y_channel)

    H = f.shape[0]
    W = f.shape[1]
    hW = int(W / 2)
    hH = int(H / 2)

    for i in range(H):
        for j in (range(W)):
            L = f_normalized[i, j]
            x, y = 0, 0

            if (j >= 0 and j < hW and i >= 0 and i < hH):
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
                f[y, x] = 0 + 0j

    fshift = np.fft.fftshift(f)
    inverse = np.fft.ifft2(fshift)
    inverse_normalized = np.abs(inverse)

    merged = cv2.merge(
        [inverse_normalized.astype(np.uint8), cr_channel, cb_channel])
    image = cv2.cvtColor(merged, cv2.COLOR_YCrCb2BGR)

    _, imdata = cv2.imencode('.JPG', image)
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
    image = cv2.imdecode(np.frombuffer(myfile, np.uint8), cv2.IMREAD_COLOR)

    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    f = np.fft.fft2(image)
    fshift = np.fft.fftshift(f)

    spectrum = FFTPlot(fshift)
    _, imdata = cv2.imencode('.JPG', spectrum)

    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)


@csrf_exempt
def brush_view(request):
    empty_canvas = request.FILES['upload']
    input_image = request.FILES['input']

    input_image = input_image.read()
    empty_canvas = empty_canvas.read()

    input_image = cv2.imdecode(np.frombuffer(input_image, np.uint8),
                               cv2.IMREAD_COLOR)
    empty_canvas = cv2.imdecode(np.frombuffer(empty_canvas, np.uint8),
                                cv2.IMREAD_GRAYSCALE)

    image = input_image

    result = np.where(empty_canvas == 255)
    brushed_coordinates = list(zip(result[0], result[1]))

    for x, y in brushed_coordinates:
        r, _, _ = image[x, y]
        image[x, y] = np.array([r, r, r])

    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)


def set_diff2d(a1: np.ndarray, a2: np.ndarray) -> np.ndarray:
    '''
    Calculate the difference between two 2D arrays.
    '''
    a1_rows = a1.view([('', a1.dtype)] * a1.shape[1])
    a2_rows = a2.view([('', a2.dtype)] * a2.shape[1])
    return np.setdiff1d(a1_rows,
                        a2_rows).view(a1.dtype).reshape(-1, a1.shape[1])


def reset_canvas(request: HttpRequest):
    '''
    Clear the session canvas.
    '''

    algos = ['clahe', 'labcc']

    for algo in algos:
        request.session[f'coords_x_{algo}'] = json.dumps([])
        request.session[f'coords_y_{algo}'] = json.dumps([])

    return JsonResponse({'status': 'ok'})


def get_algo_coords(request: HttpRequest, brushed_coordinates: np.ndarray,
                    algo):
    # get the coordinates of the brush strokes from the session
    computed_coords_x = request.session.get(f'coords_x_{algo}', "[]")
    computed_coords_y = request.session.get(f'coords_y_{algo}', "[]")

    computed_coords_x = json.loads(computed_coords_x)
    computed_coords_y = json.loads(computed_coords_y)
    computed_coordinates = np.array(
        list(zip(computed_coords_x, computed_coords_y)))

    # calculate the difference between the brush strokes and the session coordinates
    non_computed_coordinates = brushed_coordinates.copy()

    if computed_coordinates.size != 0:
        non_computed_coordinates = set_diff2d(brushed_coordinates,
                                              computed_coordinates)

    return computed_coordinates, non_computed_coordinates


def store_algo_coords(request: HttpRequest, computed_coords: np.ndarray,
                      non_computed_coords: np.ndarray, algo):
    # update the session coordinates
    if computed_coords.size != 0:
        computed_coords = np.concatenate(
            (computed_coords, non_computed_coords))
    else:
        computed_coords = non_computed_coords

    if computed_coords.size == 0:
        return

    # save the session coordinates
    coordinates_x = computed_coords[:, 0]
    coordinates_y = computed_coords[:, 1]
    stringified_coords_x = json.dumps(coordinates_x.tolist())
    request.session[f'coords_x_{algo}'] = stringified_coords_x

    stringified_coords_y = json.dumps(coordinates_y.tolist())
    request.session[f'coords_y_{algo}'] = stringified_coords_y

    request.session.modified = True


def apply_algo(request: HttpRequest, image, empty_canvas, algo_name, color_val,
               algorithm: Callable):

    # extract the x and y coordinates of the brush strokes of the algorithm
    algo_canvas = np.where(empty_canvas == color_val)
    brushed_coordinates = np.array(list(zip(algo_canvas[0], algo_canvas[1])))

    computed_coordinates_clahe, non_computed_coordinates_clahe = get_algo_coords(
        request, brushed_coordinates, algo_name)

    ## apply the algorithm to the non-computed coordinates
    image = algorithm(image, non_computed_coordinates_clahe)
    store_algo_coords(request, computed_coordinates_clahe,
                      non_computed_coordinates_clahe, algo_name)

    return image


@csrf_exempt
def algorithmic_tools_view(request: HttpRequest):

    # Drawing canvas
    empty_canvas = request.FILES['upload']
    empty_canvas = empty_canvas.read()
    empty_canvas = cv2.imdecode(np.frombuffer(empty_canvas, np.uint8),
                                cv2.IMREAD_GRAYSCALE)
    # Input image
    input_image = request.FILES['input']
    input_image = input_image.read()
    input_image = cv2.imdecode(np.frombuffer(input_image, np.uint8),
                               cv2.IMREAD_COLOR)

    image = input_image
    image = apply_algo(request, image, empty_canvas, 'clahe', 255, main_CLAHE)
    image = apply_algo(request, image, empty_canvas, 'labcc', 27, main_LabCC)

    _, imdata = cv2.imencode('.JPG', image)
    jstr = json.dumps({"image": base64.b64encode(imdata).decode('ascii')})
    return JsonResponse(jstr, safe=False)
