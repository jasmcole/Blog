%% Make errvsnoise

load('errvsnoise')

clf
plot(noises, noises*8.87e7)
hold on
plot(noises, err, 'o')
hold off

set(gca, 'XScale', 'log', 'YScale', 'log')
xlabel('RMS input pixel error')
ylabel('RMS output pixel error')

leg = legend('Expected given condition number', 'Naive matrix inversion');
leg.Location = 'northwest';

%% Make NoNoise

I = imread('cameraman.tif');
I = double(I);
N = 128;
I = imresize(I, [N N]);
sigma = 2;

A = makeSparseForwardMatrix(N, sigma);

Iblurred = blurImage(I, A);
Iblurred = Iblurred + 0*randn(size(I));
Irecovered = unblurImage(Iblurred, A);

subplot(131)
imagesc(I)
axis image, axis off, caxis([0 255])
title('Original')
subplot(132)
imagesc(Iblurred)
axis image, axis off, caxis([0 255])
title('Blurred')
subplot(133)
imagesc(Irecovered)
axis image, axis off, caxis([0 255])
title('Recovered')

%% Make 1pxNoise

I = imread('cameraman.tif');
I = double(I);
N = 128;
I = imresize(I, [N N]);
sigma = 2;

A = makeSparseForwardMatrix(N, sigma);

Iblurred = blurImage(I, A);
Iblurred = Iblurred + 1*randn(size(I));
Irecovered = unblurImage(Iblurred, A);

subplot(131)
imagesc(I)
axis image, axis off, caxis([0 255])
title('Original')
subplot(132)
imagesc(Iblurred)
axis image, axis off, caxis([0 255])
title('Blurred')
subplot(133)
imagesc(Irecovered)
axis image, axis off, caxis([0 255])
title('Recovered')

%% Make Tikhonov comparison

I = imread('cameraman.tif');
I = double(I);
N = 128;
I = imresize(I, [N N]);
sigma = 2;

A = makeSparseForwardMatrix(N, sigma);

Iblurred = blurImage(I, A);
Iblurred = Iblurred + 0.1*randn(size(I));
Irecovered = unblurImage(Iblurred, A);

subplot(221)
imagesc(I)
axis image, axis off, caxis([0 255])
title('Original')
subplot(222)
imagesc(Iblurred)
axis image, axis off, caxis([0 255])
title('Blurred')
subplot(223)
imagesc(Irecovered)
axis image, axis off, caxis([0 255])
title('Matrix Inversion')

alpha = 0.00005;
Atik = makeTikhonovMatrix(A, alpha);
Itik = unblurImageTikhonov(Iblurred, Atik, A);

subplot(224)
imagesc(Itik)
axis image, axis off, caxis([0 255])
title('Regularised')
