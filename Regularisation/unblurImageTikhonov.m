function Itik = unblurImageTikhonov(Iblurred, Atik, A)

Itik = reshape( Atik\(A'*Iblurred(:)), size(Iblurred));

end