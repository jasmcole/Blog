function I = MakeRollingImage(rotsperexposure, imin)

switch imin
    case 'Skinny'
        f = imread('Propeller_Skinny.jpg');
        centre = [717 429];
        rad = 428;
        f  = f(centre(2) - rad:centre(2) + rad, centre(1) - rad:centre(1) + rad,:);
        f = 255 - f;
    case 'Fat'
        f = imread('Propeller_Fat.png');
        centre = [1920 1360];
        rad = 1200;
        f  = f(centre(2) - rad:centre(2) + rad, centre(1) - rad:centre(1) + rad,:);
    case 'Tire'
        f = imread('Tire.jpg');
        centre = [792 598];
        rad = 590;
        f  = f(centre(2) - rad:centre(2) + rad, centre(1) - rad:centre(1) + rad,:);
        f = 255 - f;
    case 'Fractal'
        f = imread('fractal1.jpg');
        centre = [980 765];
        rad = 600;
        f  = f(centre(2) - rad:centre(2) + rad, centre(1) - rad:centre(1) + rad,:);
        f = 255 - f;
    case 'Grid'
        f = imread('TestGrid.jpg');    
end

Npix = 301;
f = imresize(f,[Npix, Npix]);
I = uint8(255*ones(size(f)));
Icomp = uint8(255*ones(size(f)));

rps = 10;
omega = 2*pi*rps;
pixps = Npix*rps/rotsperexposure;
sperpix = 1/pixps;

reds = zeros(1,Npix,3);
reds(1,:,1) = 255;

for n = 1:Npix
    t = (n-1)*sperpix;
    theta = omega*t;
    Rf = imrotate(f,theta*180/pi,'bicubic','crop');
    I(n,:,:) = Rf(n,:,:);
    Icomp(n,:,:) = I(n,:,:);
    Icomp(n+1:end,:,:) = Rf(n+1:end,:,:);
    Icomp2 = 255 - Icomp;
    Icomp2(n+2,:,:) = reds;
    imagesc(Icomp2)
    axis image xy
    ticksOff
    drawnow
    n
    if(mod(n,3) == 0)
        print(gcf, ['Shutter_Anim_5_' num2str(n) '.png'], '-dpng', '-r150')
    end
end

I = 255 - I;

imagesc(I)
axis image xy
drawnow

end