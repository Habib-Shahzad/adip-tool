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


def clahe_cdf(region: np.ndarray):
    [H, W] = region.shape
    NM = W*H

    histoy = np.bincount(region.flatten(), minlength=256)
    histoy = np.asarray(histoy, dtype=np.float32)
    len_hist = histoy.size

    clip_limit = 3 * np.mean(histoy)

    P = redistribute(histoy, clip_limit)
    L = clip_limit - P

    total_weight = 0
    
    for i in range(len_hist):
        if histoy[i] > L:
            total_weight += (histoy[i] - L)
            histoy[i] = L

    histoy += total_weight/len_hist
    
    # Step 2: Normalize the image histogram to get PDF
    # Step 3: Integrate PDF to get CDF
    cdfy = np.cumsum(histoy/NM)

    return cdfy


def calc_cdf(region):
    return clahe_cdf(region)


def main_CLAHE(input_img, coordinates_lst):
    
    rgbImage = cv2.cvtColor(input_img, cv2.COLOR_BGR2RGB)
    [y, cr, cb] = cv2.split(cv2.cvtColor(rgbImage, cv2.COLOR_RGB2YCR_CB))
    new_y = cv2.copyMakeBorder(y, 8, 8, 8, 8, cv2.BORDER_REFLECT)
    clahe = np.float32(new_y)    
    regions = [new_y[i[0]:i[0]+8, i[1]:i[1]+8] for i in coordinates_lst]
    
    with multiprocessing.Pool(5) as p:
        cdfs = p.map(calc_cdf, regions)

    for index, i in enumerate(coordinates_lst):
        clahe[i[0], i[1]] = cdfs[index][new_y[i[0], i[1]]]*255

    clahe = clahe[8:clahe.shape[0]-8, 8:clahe.shape[1]-8]
    clahe = cv2.cvtColor(
        cv2.merge((np.uint8(clahe), cr, cb)), cv2.COLOR_YCR_CB2BGR)

    return clahe
