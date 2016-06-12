% Apply the PSF matrix A to image A

function Iblurred = blurImage(I, A)

Iblurred = reshape(A*I(:), size(I));

end