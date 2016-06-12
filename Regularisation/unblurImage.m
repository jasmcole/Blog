function Irecovered = unblurImage(I, A)

Irecovered = A\I(:);
Irecovered = reshape(Irecovered, size(I));

end