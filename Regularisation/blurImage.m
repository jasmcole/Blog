function Iblurred = blurImage(I, A)

Iblurred = reshape(A*I(:), size(I));

end