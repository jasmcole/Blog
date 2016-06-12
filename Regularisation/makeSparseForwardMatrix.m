% Image size N x N - N must be even
% PSF std. dev. is sigma, in units of pixels
% PSF assumed Gaussian

function A = makeSparseForwardMatrix(N, sigma)

range = 2*sigma;

i = N/2;
j = N/2;

[dig, djg] = meshgrid(-range:range, -range:range);
indK = j + djg + N*(i + dig - 1);
r2 = dig.^2 + djg.^2;
K = exp(-r2/(2*sigma^2));

K = K/sum(K(:));
indK = indK(:);
K = K(:);

NK = length(K);
NA = NK*N^2;
is = 1:N^2;
is = repmat(is, [NK 1]);
is = is(:);
js = zeros(NA,1);
As = repmat(K, [1 N^2]);
indcent = (N/2 + N*(N/2-1));

for n = 1:N^2
    dist = n - indcent;
    js((n-1)*NK + 1:n*NK) = mod(indK + dist + 1, N^2) + 1;
end

A = sparse(is, js, As);

end