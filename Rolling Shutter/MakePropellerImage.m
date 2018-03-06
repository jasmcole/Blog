clear
clf
Nrotors = 6;
x = linspace(-1,1,301);
Npix = length(x);
[xg yg] = meshgrid(x,x);
f = zeros(size(xg));
midpoint = round((Npix-1)/2)+1;
rad = 2;
f(midpoint:end,midpoint-rad:midpoint+rad) = 1;

for n = 2:Nrotors
    f = f + imrotate(f,n*360/Nrotors,'bicubic','crop');
end

rps = 5;
omega = 2*pi*rps;
pixps = 1e4;
sperpix = 1/pixps;



for n = 1:Npix
    t = (n-1)*sperpix;
    theta = omega*t;
    Rf = imrotate(f,theta*180/pi,'bicubic','crop');
    I(n,:) = Rf(n,:);
    n
end

imagesc(I)
axis image xy
caxis([0 10])