import numpy as np
import cv2

def interp(a, b, x):
    return ((1-x)*a) + (x*b)

def bilinear_interp(img, x, y, x1, y1, x2, y2):

    [rows, columns, channels] = img.shape

    tx = x-x1
    ty = y-y1

    x1 = min(rows, max(x1, 1))
    x2 = min(rows, max(x2, 1))
    y1 = min(columns, min(y1, 1))
    y2 = min(columns, min(y2, 1))
    
    f0 = img[x1][y1]
    f1 = img[x1][y2]
    f2 = img[x2][y2]
    f3 = img[x2][y1]

    ab = interp(f0, f3, tx)
    cd = interp(f1, f2, tx)

    abcd = interp(ab, cd, ty)

    return abcd


def blockshaped(arr, nrows, ncols):
    """
    Return an array of shape (n, nrows, ncols) where
    n * nrows * ncols = arr.size

    If arr is a 2D array, the returned array looks like n subblocks with
    each subblock preserving the "physical" layout of arr.
    """
    h, w = arr.shape
    return (arr.reshape(h//nrows, nrows, -1, ncols)
               .swapaxes(1,2)
               .reshape(-1, nrows, ncols))


def unblockshaped(arr, h, w):
    """
    Return an array of shape (h, w) where
    h * w = arr.size

    If arr is of shape (n, nrows, ncols), n sublocks of shape (nrows, ncols),
    then the returned array preserves the "physical" layout of the sublocks.
    """
    n, nrows, ncols = arr.shape
    return (arr.reshape(h//nrows, -1, nrows, ncols)
               .swapaxes(1,2)
               .reshape(h, w))

def bilinear_interpolation(x, y, points):
    '''
    https://stackoverflow.com/questions/8661537/how-to-perform-bilinear-interpolation-in-python
    Interpolate (x,y) from values associated with four points.

    The four points are a list of four triplets:  (x, y, value).
    The four points can be in any order.  They should form a rectangle.

        >>> bilinear_interpolation(12, 5.5,
        ...                        [(10, 4, 100),
        ...                         (20, 4, 200),
        ...                         (10, 6, 150),
        ...                         (20, 6, 300)])
        165.0

    '''
    # See formula at:  http://en.wikipedia.org/wiki/Bilinear_interpolation

    points = sorted(points)               # order points by x, then by y
    (x1, y1, q11), (_x1, y2, q12), (x2, _y1, q21), (_x2, _y2, q22) = points

    if x1 != _x1 or x2 != _x2 or y1 != _y1 or y2 != _y2:
        raise ValueError('points do not form a rectangle')
    if not x1 <= x <= x2 or not y1 <= y <= y2:
        raise ValueError('(x, y) not within the rectangle')

    return (q11 * (x2 - x) * (y2 - y) +
            q21 * (x - x1) * (y2 - y) +
            q12 * (x2 - x) * (y - y1) +
            q22 * (x - x1) * (y - y1)
           ) / ((x2 - x1) * (y2 - y1) + 0.0)

def cv_hist_eq(Iay):
    [H,W] = Iay.shape
    NM = W*H
    EqIay = np.zeros((H,W))
    histoy = np.zeros(256)
   
    ## Step 1: Calculate the image histogram
    for j in range(H):
        for i in range(W):
            valy = Iay[j][i]
            if (valy>0 and valy<256):
                histoy[valy]=histoy[valy]+1
    


    # fig1 = plt.figure()
    # ax1 = fig1.add_subplot(121)
    # ax2 = fig1.add_subplot(122)
    # ax1.plot(range(256), histoy)

    clip_limit = max(histoy)/2

    # print(histoy)
    total_weight = 0
    for i in range(len(histoy)):
        if histoy[i] > clip_limit:
            total_weight += (histoy[i]-clip_limit)
            histoy[i] = clip_limit

    inc = total_weight//len(histoy)

    for i in range(len(histoy)):
        histoy[i] += inc

    # ax2.plot(range(256), histoy)

    ## Step 2: Normalize the image histogram to get PDF
    ## Step 3: Integrate PDF to get CDF
    pdfy=np.zeros(histoy.shape)
    cdfy=np.zeros(histoy.shape)
    
    for i in range(len(histoy)):
        pdfy[i] = histoy[i]/NM
        cdfy[i] = pdfy[i]
        if (i>1):
            cdfy[i] = cdfy[i]+cdfy[i-1] 
 
    ## Step 4: Obtain the CDF value for the given intensity and multiply by 
    # max intensity. Here because we are dealing with double datatype image
    # data is normalized so we dont have to multiply with the max intensity.
    for j in range(H):
        for i in range(W):
            val = Iay[j][i]
            if val > 0:
                EqIay[j][i] = np.round(cdfy[val]*255)

    return np.uint8(EqIay)


def main_CLAHE(input_image: np.ndarray):
    rgbImage = input_image
    rgbImage = cv2.blur(rgbImage,(3,3))
    [rows, columns, channels] = rgbImage.shape
    blockSizeR = 64 # Rows in block.
    blockSizeC = 64 # Columns in block.
    rgbImage = rgbImage[0:rows-(rows%blockSizeR), 0:columns-(columns%blockSizeC)]
    [rows, columns, channels] = rgbImage.shape
    [y,cr,cb] = cv2.split(cv2.cvtColor(rgbImage, cv2.COLOR_RGB2YCR_CB))
    img = cv2.cvtColor(cv2.merge((cv_hist_eq(y), cr, cb)), cv2.COLOR_YCR_CB2RGB)
    return img



