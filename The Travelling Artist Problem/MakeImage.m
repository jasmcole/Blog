
fname = 'ImageFile.png';
im = imread(fname);

if(min(size(im)) == 3)
    im = double(rgb2gray(im));
else
    im = double(im);
end

[Nimy, Nimx] = size(im);

% Make image smaller for speed. Change the 1e5 for higher resolution
fac = sqrt(1e5/(Nimy*Nimx));
maxL = max([Nimy, Nimx]);

xim = linspace(0, Nimx/maxL, round(Nimx*fac));
yim = linspace(0, Nimy/maxL, round(Nimy*fac));
[xg, yg] = meshgrid(xim, yim);

im = imresize(im, [round(Nimy*fac), round(Nimx*fac)]);
im = im/max(im(:));
im = 1 - im;
im(im < 0) = 0;
im(im > 1) = 1;

% Number of points to sample
Npoints = 1000;

% Number of stippling iterations
Nit = 10;

% For some reason the VoronoiLimit function fails occasionally. Nasty
% workaround to keep trying until success
success = 0;

while ~success
    
    try
        
        if(~exist('x') && ~exist('y'))
            [x,y] = pinky(xim, yim, im, Npoints);
            % It sometimes helps to offset points in case pinky produces
            % overlapping points.
            x = x + 0.001*(rand(size(x))-0.5);
            y = y + 0.001*(rand(size(y))-0.5);
        end
        
        for Nits = 1:Nit
            
            clf
            plot(x,y,'.')
            title(Nits)
            hold on
            axis image xy
            
            % Adding a little padding helps too
            [v, c, xy] = VoronoiLimit(x, y, 'figure', 'off', 'bs_ext', [0 0; 0 Nimy/maxL+0.1; Nimx/maxL+0.1 Nimy/maxL+0.1; Nimx/maxL+0.1 0]);
            
            for n = 1:length(c)
                % Get the Voronoi regions
                vx = v(c{n}, 1);
                vy = v(c{n}, 2);
                % Plot the Voronoi regions
                plot([vx; vx(1)], [vy; vy(1)])
                % Find pixels inside each region
                indsin = inpolygon(xg, yg, vx, vy);
                % Do the centre-of-mass integration
                xmean = sum(sum(im(indsin).*xg(indsin)))/sum(sum(im(indsin)));
                ymean = sum(sum(im(indsin).*yg(indsin)))/sum(sum(im(indsin)));
                
                % Check for NaNs etc.
                if(isfinite(xmean) && isfinite(ymean))
                    x(n) = xmean;
                    y(n) = ymean;
                end
            end
            
            % Keep points inside image
            x(x > Nimx/maxL) = Nimx/maxL;
            x(x < 0) = 0;
            y(y > Nimy/maxL) = Nimy/maxL;
            y(y < 0) = 0;
            
            drawnow
            
        end
        success = 1;
    catch
        success = 0;
    end
end

% Pick a solver to use. Coordinates are rounded to integers so multiply by
% large number first

%inds = runConcorde(x*1e4, y*1e4);
inds = runLKH(x*1e4, y*1e4);

% Plot solution
plot(x(inds), y(inds), '-')
axis image xy
xlim([0 1])
ylim([0 1])
axis off
drawnow

