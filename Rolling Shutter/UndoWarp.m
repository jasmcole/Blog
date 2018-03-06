rotspes = linspace(2.39,2.5,10);

for m = 1:1

f = imread('Flickr.jpg');
centre = [190 360];
rad = 300;
newf = uint8(zeros(2*rad+1, 2*rad+1, 3));

ylo = centre(2) - rad;
if(ylo < 1)
    ylo = 1;
end
dfromcent = centre(2) - ylo;
ylonew = rad+1 - dfromcent;

yhi = centre(2) + rad;
if(yhi > 640)
    yhi = 640;
end
dfromcent = yhi - centre(2);
yhinew = rad+1 + dfromcent;

xlo = centre(1) - rad;
if(xlo < 1)
    xlo = 1;
end
dfromcent = centre(1) - xlo;
xlonew = rad+1 - dfromcent;

xhi = centre(1) + rad;
if(xhi > 480)
    xhi = 480;
end
dfromcent = xhi - centre(1);
xhinew = rad+1 + dfromcent;

newf(ylonew:yhinew,xlonew:xhinew,:) = f(ylo:yhi,xlo:xhi,:);
f = imrotate(newf,-90);

scalefactor = 3;
Npix = 2*rad+1;
I = (zeros(size(f)));
Ip = (zeros(size(f)));
rotsperexposure = rotspes(m);
rps = 10;
omega = 2*pi*rps;
pixps = scalefactor*Npix*rps/rotsperexposure;
sperpix = 1/pixps;
weights = zeros(Npix,Npix);

fbig = imresize(f,[round(scalefactor*Npix) round(scalefactor*Npix)],'bicubic');

for n = 1:Npix*scalefactor
    t = (n-1)*sperpix;
    theta = -omega*t;
    Rf = uint8(zeros(round(scalefactor*Npix),round(scalefactor*Npix),3));
    Rf(n,:,:) = fbig(n,:,:);
    lineout = zeros(round(scalefactor*Npix),round(scalefactor*Npix));
    lineout(n,:) = 1;
    Rf = imrotate(Rf,theta*180/pi,'bicubic','crop');
    lineout = imrotate(lineout,theta*180/pi,'bicubic','crop');
    Rf = imresize(Rf,[Npix Npix],'bicubic');
    lineout = imresize(lineout,[Npix Npix],'bicubic');
    weights = weights + lineout;
    I = I + double(Rf);
    if(mod(n,50) == 0)
        subplot(121)
        imagesc(fbig)
        line([0 scalefactor*Npix], [n n], 'Color', 'red')
        ticksOff
        axis image xy
        circle(rad+1,rad+1,260)
        subplot(122)
        Ip(:,:,1) = uint8(I(:,:,1)./weights);
        Ip(:,:,2) = uint8(I(:,:,2)./weights);
        Ip(:,:,3) = uint8(I(:,:,3)./weights);
        image(Ip/255)
        colormap gray
        caxis([0 255])
        ticksOff
        axis image xy
        drawnow
    end
    %     if(mod(n,6) == 0)
             
    %     end
    n
end
%print(gcf, ['Undo_' num2str(m) '.png'], '-dpng', '-r100')
end