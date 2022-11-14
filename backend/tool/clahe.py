import numpy as np
import cv2
import multiprocessing
   
  





def redistribute(hist, clip_limit):

    top = clip_limit
    bottom = 0
    S = 0
    while (top - bottom > 1):
        middle = (top + bottom) / 2
        S = 0
        for i in range(len(hist)):
            if hist[i] > middle:
                S += (hist[i]-middle)
        if S > ((clip_limit - middle)*len(hist)):
            top = middle
        else:
            bottom = middle

    return (S/len(hist))+bottom


def clahe_cdf(Iay):
    [H, W] = Iay.shape
    NM = W*H
    EqIay = np.zeros((H, W))
    histoy = np.zeros(256)

    # Step 1: Calculate the image histogram
    for j in range(H):
        for i in range(W):
            valy = Iay[j][i]
            if (valy > 0 and valy < 256):
                histoy[valy] = histoy[valy]+1

    clip_limit = 3 * np.mean(histoy)

    P = redistribute(histoy, clip_limit)
    L = clip_limit - P

    total_weight = 0
    for i in range(len(histoy)):
        if histoy[i] > L:
            total_weight += (histoy[i]-L)
            histoy[i] = L

    inc = total_weight/len(histoy)

    for i in range(len(histoy)):
        histoy[i] += inc

    # Step 2: Normalize the image histogram to get PDF
    # Step 3: Integrate PDF to get CDF
    pdfy = np.zeros(histoy.shape)
    cdfy = np.zeros(histoy.shape)

    for i in range(len(histoy)):
        pdfy[i] = histoy[i]/NM
        cdfy[i] = pdfy[i]
        if (i > 1):
            cdfy[i] = cdfy[i]+cdfy[i-1]

    return cdfy


def calc_cdf(region):
    return clahe_cdf(region)


def main_CLAHE(input_img, lst):

    rgbImage = cv2.cvtColor(input_img, cv2.COLOR_BGR2RGB)
    [y, cr, cb] = cv2.split(cv2.cvtColor(rgbImage, cv2.COLOR_RGB2YCR_CB))
    new_y = cv2.copyMakeBorder(y, 8, 8, 8, 8, cv2.BORDER_REFLECT)
    clahe = np.float32(new_y)

    pool = multiprocessing.Pool()
    pool = multiprocessing.Pool(processes=30)
    regions = [new_y[i[0]:i[0]+8, i[1]:i[1]+8] for i in lst]
    cdfs = pool.map(calc_cdf, regions)

    for index, i in enumerate(lst):
        clahe[i[0], i[1]] = cdfs[index][new_y[i[0], i[1]]]*255

    clahe = clahe[8:clahe.shape[0]-8, 8:clahe.shape[1]-8]
    clahe = cv2.cvtColor(
        cv2.merge((np.uint8(clahe), cr, cb)), cv2.COLOR_YCR_CB2BGR)

    return clahe
