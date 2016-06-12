% Perform Tikhonov iteration on Iblurred
% First create Atik using makeTikhonovMatrix

function Itik = unblurImageTikhonov(Iblurred, Atik, A)

Itik = reshape( Atik\(A'*Iblurred(:)), size(Iblurred));

end