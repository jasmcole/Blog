
clf
file = 'pattern3';
switch file
    case 'pattern2'
    P = imread('Pattern2.png');
    P = repmat(P,3);
    case 'pattern3'
    P = imread('Pattern3.png');
    P = P(400:3400, 400:3400);
    P = 255 - P*6;
    case 'pattern4'
    P = imread('Pattern4.jpg');
    case 'banksy'
    P = imread('Banksy.png');
    P = padarray(P, [500 500], 255);
end

P = 1-im2bw(P);
Nmin = min(size(P));
P = P(1:Nmin, 1:Nmin);
[xg, yg] = meshgrid(1:Nmin, 1:Nmin);
P((xg - Nmin/2).^2 + (yg - Nmin/2).^2 > 0.99*0.25*Nmin^2) = 0;
P = padarray(P, [1 1], 0);

CC = bwconncomp(P);

dtheta    = pi/24;
theta     = (-pi:dtheta:(pi-dtheta))';
nodeouter = [1.1*cos(theta) 1.1*sin(theta)];
Nnodes    = length(nodeouter);
nodelist  = (1:Nnodes)';
allnodes  = nodeouter;
alledges  = [nodelist , mod(nodelist, Nnodes)+1];

for n = 1:CC.NumObjects
%for n = 2:2
    newP = zeros(size(P));
    newP(CC.PixelIdxList{1,n}(:)) = 1;
    newP = filter2(fspecial('average',5),newP);
    C = contourc(newP,[0.2 0.2]);
    C = C(:,2:end)';
    C2 = dpsimplify(C,1);
    m = 1;
    
    while m <= length(C2(:,1))
       if(C2(m,1) == 1 || C2(m,2) == 1)
           C2(m,:) = [];
       else
           m = m + 1;
       end
    end
    
    C2 = (C2 - Nmin/2)/(Nmin/2);
    C = (C - Nmin/2)/(Nmin/2);
    figure(1)
    hold all
    plot(C2(:,1), C2(:,2))
    axis image xy
    drawnow
    
    nodeinner  = C2;
    Nnodeshole = length(nodeinner);
    nodelist   = (1:Nnodeshole)';
    edgelist   = [nodelist , mod(nodelist, Nnodeshole)+1];
    edgelist   = edgelist + Nnodes; 
    
    allnodes   = [allnodes; nodeinner];
    alledges   = [alledges; edgelist];
    Nnodes     = Nnodes + Nnodeshole;
    n
end

%%

hdata.fun = @(x,y) 0.05*(1 + ((x.^2 + y.^2)/a^2)).^2;
[p,t] = mesh2d(allnodes, alledges);

%%
as = 0.5;

for n = 1:length(as)
a = as(n);
h = 0;

x = p(:,1);
y = p(:,2);
z = zeros(size(x));
r = sqrt(x.^2 + y.^2);
phi = atan2(y,x);
theta = atan(r/(a+h));
alpha = 2*theta;

xnew = a*sin(alpha).*cos(phi);
ynew = a*sin(alpha).*sin(phi);
znew = -a*cos(alpha);

p2 = [xnew, ynew, znew];
stlwrite('Test.stl', t, p2)

fv.faces = t;
fv.vertices = p2;
clf
figure(3)
patch(fv, 'FaceColor', [1 1 1], 'EdgeColor', 'black', 'LineWidth', 0.1)
axis equal
axis off
xlim([-a a])
ylim([-a a])
zlim([-a a])
camlight head
view(58,28)
zoom(1.5)
drawnow
%print(gcf, [num2str(n) '.png'], '-dpng', '-r250')
end
