%% Circle

c = 299792458; 

gamma = 1.2;
beta = sqrt(1 - 1/gamma^2);
v = beta*c;

r = 1e-3;

omega = v/r;
T = 2*pi/omega;
t = linspace(0,3*T, 300);
x = r*cos(omega*t);
y = r*sin(omega*t);
clo = 10;
chi = 35;
SynchrotronExact(x,y,t,5*r,0,'Synch1-2',clo,chi)

%% Straight line
clear
c = 299792458; 

r = 5e-3;
t = linspace(0,2*r/c, 100);
gamma = linspace(1.2,1.2,length(t));
beta = sqrt(1 - 1./gamma.^2);
v = beta*c;
y = zeros(size(t));
x = -r + cumtrapz(t,v);

SynchrotronExact(x,y,t,r,0,'Straight5', 10, 35)

%% Dipole
clear
c = 299792458; 

gamma = 10;
r = 1e-3;
omega = (c/r)*sqrt(1 - 1/gamma^2);
T = 2*pi/omega;
t = linspace(0,20*T, 200);
y = r*sin(omega*t);
x = zeros(size(t));

rad = 50*r;
saveFlag = 1;
SynchrotronExact(x,y,t,rad,saveFlag,'Dipole',10,30)

%% Undulator

clear
c = 299792458; 

gamma = 5;
v = sqrt(1 - 1/gamma^2)*c;
r = 1e-3;
rad = 1.1*r;
T = 2*rad/c;
omega = 20*pi/T;
t = linspace(0,T, 200);
y = 0.01*r*sin(omega*t);
x = -r + cumtrapz(t,v*sqrt(1 - (omega*0.01*r/v)^2*cos(omega*t).^2));

saveFlag = 1;
SynchrotronExact(x,y,t,rad,saveFlag,'Undulator',15,40)




