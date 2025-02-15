export async function encryptFile(file: File): Promise<ArrayBuffer> {
  // Generate a random key for AES-GCM
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']
  );

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Read the file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt the file
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileBuffer
  );

  // Export the key
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);

  // Combine IV + encrypted key + encrypted content
  const encryptedFile = new Uint8Array(
    iv.length + exportedKey.byteLength + encryptedContent.byteLength
  );
  encryptedFile.set(iv, 0);
  encryptedFile.set(new Uint8Array(exportedKey), iv.length);
  encryptedFile.set(
    new Uint8Array(encryptedContent),
    iv.length + exportedKey.byteLength
  );

  return encryptedFile.buffer;
}

export async function decryptFile(
  encryptedData: ArrayBuffer
): Promise<ArrayBuffer> {
  const encryptedArray = new Uint8Array(encryptedData);

  // Extract IV, key, and encrypted content
  const iv = encryptedArray.slice(0, 12);
  const encryptedKey = encryptedArray.slice(12, 44);
  const encryptedContent = encryptedArray.slice(44);

  // Import the key
  const key = await window.crypto.subtle.importKey(
    'raw',
    encryptedKey,
    'AES-GCM',
    true,
    ['decrypt']
  );

  // Decrypt the content
  const decryptedContent = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedContent
  );

  return decryptedContent;
}