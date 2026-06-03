import { customAlphabet } from 'nanoid';

const generateUid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export default generateUid;
