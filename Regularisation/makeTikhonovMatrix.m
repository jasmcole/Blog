function Atik = makeTikhonovMatrix(A, alpha)

[N2, ~] = size(A);
Atik = (A'*A + alpha*speye(N2));

end