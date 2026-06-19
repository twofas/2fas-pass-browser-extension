# Emulator gRPC client: drive the virtual-scene camera (rotate / move) so the 2FAS
# scanner can read a QR poster up close. Auth via the bearer token in the emulator's
# discovery .ini. Usage:
#   sceneNav.py status
#   sceneNav.py rotate <x> <y> <z>           # radians, relative to current
#   sceneNav.py move <x> <y> <z> <seconds>   # velocity m/s for <seconds>, then stop
import glob, os, sys, time
sys.path.insert(0, '/tmp/emugrpc/stubs')
import grpc
import emulator_controller_pb2 as pb
import emulator_controller_pb2_grpc as pbg
from google.protobuf import empty_pb2


def discovery():
    home = os.path.expanduser('~')
    inis = sorted(glob.glob(f'{home}/Library/Caches/*/avd/running/pid_*.ini'), key=os.path.getmtime)
    if not inis:
        raise SystemExit('no emulator discovery ini found')
    d = {}
    for line in open(inis[-1]):
        if '=' in line:
            k, v = line.strip().split('=', 1)
            d[k] = v
    return d


def stub_md():
    d = discovery()
    port = d.get('grpc.port', '8554')
    token = d.get('grpc.token', '')
    ch = grpc.insecure_channel(f'localhost:{port}')
    md = [('authorization', f'Bearer {token}')] if token else []
    return pbg.EmulatorControllerStub(ch), md


POSITION = pb.PhysicalModelValue.PhysicalType.POSITION
ROTATION = pb.PhysicalModelValue.PhysicalType.ROTATION


def get_pose(stub, md):
    p = stub.getPhysicalModel(pb.PhysicalModelValue(target=POSITION), metadata=md)
    r = stub.getPhysicalModel(pb.PhysicalModelValue(target=ROTATION), metadata=md)
    return list(p.value.data), list(r.value.data)


def set_pose(stub, md, pos=None, rot=None):
    if pos is not None:
        stub.setPhysicalModel(pb.PhysicalModelValue(target=POSITION,
            value=pb.ParameterValue(data=pos)), metadata=md)
    if rot is not None:
        stub.setPhysicalModel(pb.PhysicalModelValue(target=ROTATION,
            value=pb.ParameterValue(data=rot)), metadata=md)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    stub, md = stub_md()
    if cmd == 'status':
        st = stub.getStatus(empty_pb2.Empty(), metadata=md)
        print('OK booted=%s uptime=%sms' % (st.booted, st.uptime))
    elif cmd == 'getpose':
        pos, rot = get_pose(stub, md)
        print('POS', pos, 'ROT', rot)
    elif cmd == 'setpose':
        # setpose px py pz rx ry rz
        v = [float(a) for a in sys.argv[2:8]]
        set_pose(stub, md, pos=v[0:3], rot=v[3:6])
        print('set pose pos', v[0:3], 'rot', v[3:6])
    elif cmd == 'rotate':
        x, y, z = (float(a) for a in sys.argv[2:5])
        stub.rotateVirtualSceneCamera(pb.RotationRadian(x=x, y=y, z=z), metadata=md)
        print('rotated', x, y, z)
    elif cmd == 'move':
        x, y, z = (float(a) for a in sys.argv[2:5])
        dur = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
        stub.setVirtualSceneCameraVelocity(pb.Velocity(x=x, y=y, z=z), metadata=md)
        time.sleep(dur)
        stub.setVirtualSceneCameraVelocity(pb.Velocity(x=0, y=0, z=0), metadata=md)
        print('moved', x, y, z, 'for', dur, 's')
    else:
        raise SystemExit('unknown cmd ' + cmd)


main()
