import numpy as np
import cv2
import numpy.linalg as lin

def main_LabCC(input_image, lst):

    rgb_to_lms = np.array((np.array((0.3811, 0.5783, 0.0402)), np.array(
            (0.1967, 0.7244, 0.0782)), np.array((0.0241, 0.1288, 0.8444))))

    loglms_to_lab = np.matmul(np.array((np.array(((1/np.sqrt(3)), 0, 0)), np.array((0, (1/np.sqrt(6)), 0)),
                                        np.array((0, 0, (1/np.sqrt(2)))))), np.array((np.array((1, 1, 1)), np.array((1, 1, -2)), np.array((1, -1, 0)))))

    lab_to_lms = np.matmul(np.array((np.array((1, 1, 1)), np.array((1, 1, -1)), np.array((1, -2, 0)))),
                            np.array((np.array(((np.sqrt(3)/3), 0, 0)), np.array((0, (np.sqrt(6)/6), 0)),
                                        np.array((0, 0, (np.sqrt(2)/2))))))

    lms_to_rgb = np.array((np.array((4.4679, -3.5873, 0.1193)), np.array(
        (-1.2186, 2.3809, -0.1624)), np.array((0.0497, -0.2439, 1.2045))))

    img = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)
    img = cv2.normalize(img, None, alpha=0.00001, beta=1,
                        norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_32F)

    new_img = np.zeros(img.shape)
    points = []
    for i in lst:
        pixel = img[i[0]][i[1]]
        pixel = np.dot(rgb_to_lms, pixel)
        pixel = np.log(pixel)
        pixel = np.dot(loglms_to_lab, pixel)
        points.append([pixel[0], pixel[1], pixel[2]])
        new_img[i[0]][i[1]] = [pixel[0], pixel[1], pixel[2]]

    mean_val = np.array([points]).mean(axis=1)[0]


    for i in lst:

        pixel = new_img[i[0]][i[1]]

        pixel[1] -= mean_val[1]*0.8
        pixel[2] -= mean_val[2]*0.8

        pixel = np.dot(lab_to_lms, pixel)
        pixel = np.exp(pixel)
        pixel = np.dot(lms_to_rgb, pixel)
        img[i[0]][i[1]] = [pixel[0], pixel[1], pixel[2]]

    img = cv2.normalize(img, None, alpha=0, beta=255,
                        norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    return img

