import numpy as np
import cv2

# Code from: https://lindevs.com/apply-gamma-correction-to-an-image-using-opencv#:~:text=Gamma%20correction%20can%20be%20implemented,performs%20a%20lookup%20table%20transform.
def gammaCorrection(src, gamma):
    invGamma = 1 / gamma

    table = [((i / 255) ** invGamma) * 255 for i in range(256)]
    table = np.array(table, np.uint8)

    return cv2.LUT(src, table)

# https://itecnote.com/tecnote/python-how-to-convert-from-srgb-to-linear-srgb-for-computing-the-color-correction-matrix-in-opencv-ccm/
def srgb_to_linsrgb (srgb):
    """Convert sRGB values to physically linear ones. The transformation is
       uniform in RGB, so *srgb* can be of any shape.

       *srgb* values should range between 0 and 1, inclusively.

    """
    gamma = ((srgb + 0.055) / 1.055)**2.4
    scale = srgb / 12.92
    return np.where (srgb > 0.04045, gamma, scale)


def main_LabCC(input_image):

    img = input_image

    img = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)

    img = cv2.normalize(img,
                        None,
                        alpha=0,
                        beta=1,
                        norm_type=cv2.NORM_MINMAX,
                        dtype=cv2.CV_32F)
    img = srgb_to_linsrgb(img)
    img = cv2.normalize(img,
                        None,
                        alpha=0,
                        beta=255,
                        norm_type=cv2.NORM_MINMAX,
                        dtype=cv2.CV_8U)
    # img = gammaCorrection(img, 2.2)

    [rows, columns, channels] = img.shape

    rgb_to_xyz = np.array((np.array(
        (0.5141, 0.3239, 0.1604)), np.array(
            (0.2651, 0.6702, 0.0641)), np.array((0.0241, 0.1228, 0.8444))))
    xyz_to_lms = np.array((np.array(
        (0.3897, 0.6890, 0.0787)), np.array(
            (-0.2298, 1.1834, 0.0464)), np.array((0.0000, 0.0000, 1.0000))))
    loglms_to_lab = np.dot(
        np.array((np.array(
            ((1 / np.sqrt(3)), 0, 0)), np.array(
                (0, (1 / np.sqrt(6)), 0)), np.array(
                    (0, 0, (1 / np.sqrt(2)))))),
        np.array((np.array((1, 1, 1)), np.array(
            (1, 1, -2)), np.array((1, -1, 0)))))

    for i in range(rows):
        for j in range(columns):
            pixel = np.float32(img[i][j])
            pixel = np.dot(rgb_to_xyz * xyz_to_lms, pixel)
            gray_world = pixel / np.mean(pixel)
            pixel = np.dot(loglms_to_lab, np.log(pixel) - np.log(gray_world))
            pixel -= np.mean(pixel)
            img[i][j] = pixel * 255

    img = cv2.cvtColor(img, cv2.COLOR_LAB2RGB)

    return img
