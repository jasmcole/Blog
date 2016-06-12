% Simple image deconvolution using matrix inverse
% I - blurred image
% A - PSF matrix

function Irecovered = unblurImage(I, A)

Irecovered = A\I(:);
Irecovered = reshape(Irecovered, size(I));

end