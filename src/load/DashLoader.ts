import {
  Mesh,
  Bone,
  Vector3,
  Color,
  BufferGeometry,
  Float32BufferAttribute,
  BufferAttribute,
  MeshNormalMaterial,
  DoubleSide,
  Skeleton,
  SkinnedMesh,
  SkeletonHelper,
  Group
} from "three";

// Mesh Header Type
type MeshHeader = {
  name: string;
  triCount: number;
  quadCount: number;
  vertexCount: number;
  triOfs: number;
  quadOfs: number;
  vertexOfs: number;
  activeVertexColorOfs: number;
  staticVertexColorOfs: number;
};

type Indice = {
  materialIndex: number;
  index: number;
  u: number;
  v: number;
};

// Global Scale
const SCALE = 0.00125;

const names = [
  // Root (body)
  {
    id: 0,
    parent: -1,
    name: "root",
  },
  // Head
  {
    id: 1,
    parent: 0,
    name: "head",
  },
  // Right arm - From the shoulder
  {
    id: 2,
    parent: 0,
    name: "right_shoulder",
  },
  // Right elbow
  {
    id: 3,
    parent: 2,
    name: "right_elbow",
  },
  // Right hand
  {
    id: 4,
    parent: 3,
    name: "right_hand",
  },
  // Left arm - From the shoulder (needs adjusts)
  {
    id: 5,
    parent: 0,
    name: "left_shoulder",
  },
  // Left Elbow
  {
    id: 6,
    parent: 5,
    name: "left_elbow",
  },
  // Left hand
  {
    id: 7,
    parent: 6,
    name: "left_hand",
  },
  // Hip Bone
  {
    id: 8,
    parent: 0,
    name: "hips",
  },
  // Right Leg
  {
    id: 9,
    parent: 8,
    name: "right_leg",
  },
  // Right Knee
  {
    id: 10,
    parent: 9,
    name: "right_knee",
  },
  // Right Foot
  {
    id: 11,
    parent: 10,
    name: "right_foot",
  },
  // Left Leg
  {
    id: 12,
    parent: 8,
    name: "left_leg",
  },
  // Left Knee
  {
    id: 13,
    parent: 12,
    name: "left_knee",
  },
  // Left Foot
  {
    id: 14,
    parent: 13,
    name: "left_foot",
  },
];

const createMesh = (strip: MeshHeader, view: DataView) => {
  const { vertexCount, vertexOfs } = strip;
  const vertexList = readVertexList(view, vertexOfs, vertexCount);
  const { activeVertexColorOfs } = strip;
  const colors = readVertexColors(view, activeVertexColorOfs, vertexCount);
  const { triCount, triOfs } = strip;
  const triangleFaces = readFace(view, triOfs, triCount, false);
  const { quadCount, quadOfs } = strip;
  const quadFaces = readFace(view, quadOfs, quadCount, true);

  // Create a new BufferGeometry
  const geometry = new BufferGeometry();

  // Convert vertexList to a Float32Array for the positions attribute
  const positions = new Float32Array(vertexList.length * 3);
  vertexList.forEach((vertex, i) => {
    positions[i * 3] = vertex.x;
    positions[i * 3 + 1] = vertex.y;
    positions[i * 3 + 2] = vertex.z;
  });
  geometry.setAttribute("position", new BufferAttribute(positions, 3));

  // Convert colors to a Float32Array for the color attribute
  if (colors) {
    const colorArray = new Float32Array(colors.length * 3);
    colors.forEach((color, i) => {
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    });
    geometry.setAttribute("color", new BufferAttribute(colorArray, 3));
  }

  // Combine triangles and quads into a single index array
  const indices: number[] = [];
  triangleFaces.forEach((face) =>
    indices.push(face[0].index, face[1].index, face[2].index),
  );
  quadFaces.forEach((face) =>
    indices.push(face[0].index, face[1].index, face[2].index),
  );

  // Set the indices to the geometry
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new MeshNormalMaterial();
  const mesh = new Mesh(geometry, material);
  return mesh;
}


const loadCharacter = async (filename: string): Promise<Group> => {
  const req = await fetch(`/MegaManLegends2-VRM/${filename}`);
  if (!req.ok) {
    // Handle HTTP errors
    throw new Error(
      `Failed to load ${filename}: ${req.status} ${req.statusText}`,
    );
  }
  const buffer = await req.arrayBuffer();
  const archive = new DataView(buffer);
  const length = archive.getUint32(0x04, true);
  const file = buffer.slice(0x30, 0x30 + length);
  const view = new DataView(file);



  // First we read bones
  let ofs = 0x00;
  const bones: Bone[] = [];
  names.forEach((boneDef) => {
    const { parent, name } = boneDef;
    const bone = new Bone();
    bone.name = name;
    bone.position.x = view.getInt16(ofs + 0, true) * SCALE;
    bone.position.y = view.getInt16(ofs + 2, true) * SCALE;
    bone.position.z = view.getInt16(ofs + 4, true) * SCALE;

    console.log(bone.position);

    ofs += 6;
    if (bones[parent]) {
      bones[parent].add(bone);
    }
    bone.updateMatrix();
    bone.updateMatrixWorld();
    bones.push(bone);
  });
  const skel = new Skeleton(bones);
  const geo = new BufferGeometry();
  const skin = new SkinnedMesh(geo);
  const rootBone = skel.bones[0];
  skin.add(rootBone); // bind the skeleton to the mesh mesh.bind( skeleton );

  // Then we read the body
  const BODY_OFS = 0x80;
  const bodyStrips = readStrips(view, BODY_OFS, [
    "00_BODY",
    "01_HIP",
    "02_LEG_RIGHT_TOP",
    "03_LEG_RIGHT_BOTTOM",
    "04_LEG_LEFT_TOP",
    "05_LEG_LEFT_BOTTOM",
  ]);

  // Then we read the body
  const HEAD_OFS = 0xb60;
  const headStrips = readStrips(view, HEAD_OFS, [
    "10_HELMET", "11_FACE", "12_MOUTH"
  ]);

  // Then we read the body
  const FEET_OFS = 0x1800;
  const feetStrips = readStrips(view, FEET_OFS, [
    "20_FOOT_RIGHT", "21_FOOT_LEFT"
  ]);

  // Then we read the body
  const LEFT_OFS = 0x1dd0;
  const leftArmStrips = readStrips(view, LEFT_OFS, [
    "30_LEFT_SHOULDER", "31_LEFT_ARM", "32_LEFT_HAND"
  ]);

  // Then we read the body
  const BUSTER_OFS = 0x2220;
  const busterStrips = readStrips(view, BUSTER_OFS, [
    "40_LEFT_SHOULDER", "41_BUSTER", "42_BULLET_MAYBE"
  ]);

  // Then we read the body
  const RIGHT_OFS = 0x26f0;
  const rightArmStrips = readStrips(view, RIGHT_OFS, [
    "50_RIGHT_SHOULDER", "51_RIGHT_ARM", "52_RIGHT_HAND"
  ]);

  // Generate Mesh from Headers
  const bodyMesh = bodyStrips.map(strip => createMesh(strip, view));
  const headMesh = headStrips.map(strip => createMesh(strip, view));
  const feetMesh = feetStrips.map(strip => createMesh(strip, view));
  const leftArmMesh = leftArmStrips.map(strip => createMesh(strip, view));
  const busterMesh = busterStrips.map(strip => createMesh(strip, view));
  const rightArmMesh = rightArmStrips.map(strip => createMesh(strip, view));


  // Create group
  const group = new Group();
  const helper = new SkeletonHelper(skin);
  // parentGroup.add(skin);
  group.add(helper);


  // Body
  const root = skin.children[0]
  root.add(bodyMesh[0])
  bodyMesh[0].position.x = root.position.x;
  bodyMesh[0].position.y = root.position.y;
  bodyMesh[0].position.z = root.position.z;

  console.log('root')
  console.log(root.children)

  // Hips
  const hips = root.children[3]
  hips.add(bodyMesh[1])
  hips.getWorldPosition(bodyMesh[1].position);

  // Right Leg
  const rightLeg = hips.children[0];
  rightLeg.add(bodyMesh[2])
  rightLeg.getWorldPosition(bodyMesh[2].position);

  // Right Knee
  const rightKnee = rightLeg.children[0];
  rightKnee.add(bodyMesh[3])
  rightKnee.getWorldPosition(bodyMesh[3].position);

  // Left Leg
  const leftLeg = hips.children[1];
  leftLeg.add(bodyMesh[4])
  leftLeg.getWorldPosition(bodyMesh[4].position);

  // Left Knee
  const leftKnee = leftLeg.children[0];
  leftKnee.add(bodyMesh[5])
  leftKnee.getWorldPosition(bodyMesh[5].position);

  // Head
  const head = root.children[0];
  head.add(headMesh[0])
  head.getWorldPosition(headMesh[0].position)
  head.add(headMesh[1])
  head.getWorldPosition(headMesh[1].position)
  head.add(headMesh[2])
  head.getWorldPosition(headMesh[2].position)

  // Right Foot
  const rightFoot = rightKnee.children[0];
  rightFoot.add(feetMesh[0])
  rightFoot.getWorldPosition(feetMesh[0].position);

  // Left Foot
  const leftFoot = leftKnee.children[0];
  leftFoot.add(feetMesh[1])
  leftFoot.getWorldPosition(feetMesh[1].position);

  // left Arm
  const leftShoulder = root.children[2];
  leftShoulder.add(leftArmMesh[0])
  leftShoulder.getWorldPosition(leftArmMesh[0].position);

  const leftElbow = leftShoulder.children[0];
  leftElbow.add(leftArmMesh[1])
  leftElbow.getWorldPosition(leftArmMesh[1].position);

  const leftHand = leftElbow.children[0];
  leftHand.add(leftArmMesh[2])
  leftHand.getWorldPosition(leftArmMesh[2].position);

  // right Arm
  const rightShoulder = root.children[1];
  rightShoulder.add(rightArmMesh[0])
  rightShoulder.getWorldPosition(rightArmMesh[0].position);

  const rightElbow = rightShoulder.children[0];
  rightElbow.add(rightArmMesh[1])
  rightElbow.getWorldPosition(rightArmMesh[1].position);

  const rightHand = rightElbow.children[0];
  rightHand.add(rightArmMesh[2])
  rightHand.getWorldPosition(rightArmMesh[2].position);

  //group.add(skin);
  group.add(bodyMesh[0]);
  group.add(bodyMesh[1]);
  group.add(bodyMesh[2]);
  group.add(bodyMesh[3]);
  group.add(bodyMesh[4]);
  group.add(bodyMesh[5]);

  group.add(headMesh[0]);
  group.add(headMesh[1]);
  group.add(headMesh[2]);

  group.add(feetMesh[0]);
  group.add(feetMesh[1]);

  group.add(leftArmMesh[0])
  group.add(leftArmMesh[1])
  group.add(leftArmMesh[2])

  group.add(rightArmMesh[0])
  group.add(rightArmMesh[1])
  group.add(rightArmMesh[2])

  group.rotation.x = Math.PI;
  return group;
};

const readStrips = (view: DataView, stripOfs: number, names: string[]) => {
  let ofs = stripOfs;
  const meshes: MeshHeader[] = [];
  names.forEach((name) => {
    const triCount = view.getUint8(ofs + 0);
    const quadCount = view.getUint8(ofs + 1);
    const vertexCount = view.getUint8(ofs + 2);

    const triOfs = view.getUint32(ofs + 0x04, true);
    const quadOfs = view.getUint32(ofs + 0x08, true);
    const vertexOfs = view.getUint32(ofs + 0x0c, true);
    const activeVertexColorOfs = view.getUint32(ofs + 0x10, true);
    const staticVertexColorOfs = view.getUint32(ofs + 0x14, true);
    ofs += 0x18;

    meshes.push({
      name,
      triCount,
      quadCount,
      vertexCount,
      triOfs,
      quadOfs,
      vertexOfs,
      activeVertexColorOfs,
      staticVertexColorOfs,
    });
  });

  return meshes;
};

const readVertexList = (
  view: DataView,
  vertexOfs: number,
  vertexCount: number,
) => {
  const VERTEX_MASK = 0b1111111111;
  const VERTEX_MSB = 0b1000000000;
  const VERTEX_LOW = 0b0111111111;
  const vertices: Vector3[] = [];

  let ofs = vertexOfs;
  for (let i = 0; i < vertexCount; i++) {
    const dword = view.getUint32(ofs, true);
    ofs += 4;

    const xBytes = (dword >> 0x00) & VERTEX_MASK;
    const yBytes = (dword >> 0x0a) & VERTEX_MASK;
    const zBytes = (dword >> 0x14) & VERTEX_MASK;

    const xHigh = (xBytes & VERTEX_MSB) * -1;
    const xLow = xBytes & VERTEX_LOW;

    const yHigh = (yBytes & VERTEX_MSB) * -1;
    const yLow = yBytes & VERTEX_LOW;

    const zHigh = (zBytes & VERTEX_MSB) * -1;
    const zLow = zBytes & VERTEX_LOW;

    const vec3 = new Vector3(xHigh + xLow, yHigh + yLow, zHigh + zLow);
    vec3.multiplyScalar(SCALE);
    vertices.push(vec3);
  }

  return vertices;
};

const readVertexColors = (
  view: DataView,
  vertexColorOfs: number,
  vertexCount: number,
): Color[] => {
  let ofs = vertexColorOfs;
  const colors: Color[] = [];
  for (let i = 0; i < vertexCount; i++) {
    const r = view.getUint8(ofs + 0) / 255;
    const g = view.getUint8(ofs + 1) / 255;
    const b = view.getUint8(ofs + 2) / 255;
    const color = new Color(r, g, b);
    colors.push(color);
  }

  return colors;
};

const readFace = (
  view: DataView,
  faceOfs: number,
  faceCount: number,
  isQuad: boolean,
) => {
  const FACE_MASK = 0x7f;
  const PIXEL_TO_FLOAT_RATIO = 0.00390625;
  const PIXEL_ADJUSTMEST = 0.001953125;

  const list: Indice[][] = [];
  let ofs = faceOfs;
  for (let i = 0; i < faceCount; i++) {
    const au = view.getUint8(ofs + 0);
    const av = view.getUint8(ofs + 1);
    const bu = view.getUint8(ofs + 2);
    const bv = view.getUint8(ofs + 3);
    const cu = view.getUint8(ofs + 4);
    const cv = view.getUint8(ofs + 5);
    const du = view.getUint8(ofs + 6);
    const dv = view.getUint8(ofs + 7);

    const dword = view.getUint32(ofs + 0x08, true);
    ofs += 0x0c;

    const materialIndex = (dword >> 28) & 0x3;

    const indexA = (dword >> 0x00) & FACE_MASK;
    const indexB = (dword >> 0x07) & FACE_MASK;
    const indexC = (dword >> 0x0e) & FACE_MASK;
    const indexD = (dword >> 0x15) & FACE_MASK;

    const a = {
      materialIndex,
      index: indexA,
      u: au * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
      v: av * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
    };

    const b = {
      materialIndex,
      index: indexB,
      u: bu * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
      v: bv * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
    };

    const c = {
      materialIndex,
      index: indexC,
      u: cu * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
      v: cv * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
    };

    const d = {
      materialIndex,
      index: indexD,
      u: du * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
      v: dv * PIXEL_TO_FLOAT_RATIO + PIXEL_ADJUSTMEST,
    };

    list.push([a, c, b]);

    if (!isQuad) {
      continue;
    }

    list.push([b, c, d]);
  }

  return list;
};

export { loadCharacter };
