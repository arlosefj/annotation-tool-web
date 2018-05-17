import numpy as np
import cv2 as cv
import time

localtime = time.strftime("%Y%m%d%H%M%S", time.localtime()) 

image = cv.imread('./img/image.png')
mask = cv.imread('./img/mask.png', 0)

cv.imwrite('./data/image-'+localtime+'.png', image)
cv.imwrite('./data/mask-'+localtime+'.png', mask)

mask = np.where((mask>127), 3, 0).astype('uint8')
bgdmodel = np.zeros((1, 65), np.float64)
fgdmodel = np.zeros((1, 65), np.float64)
cv.grabCut(image, mask, None, bgdmodel, fgdmodel, 1, cv.GC_INIT_WITH_MASK)
mask = np.where((mask==1)+(mask==3), 255, 0).astype('uint8')
cv.imwrite('./img/retMask.png', mask)

cv.imwrite('./data/retMask-'+localtime+'.png', mask)