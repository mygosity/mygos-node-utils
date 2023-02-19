import CryptoJS from 'crypto-js';

import { getTranspiledData } from '../common';
import { getStringByteCount } from '../common/pure/misc';
import { env } from '../../commands';
import fileHelper from '../file';

export async function createEncryptedCode(baseTargetPath: string, filename: string, extension: string) {
	const sourceFile = `${baseTargetPath}/${filename}.${extension}`;

	const { data, success } = await fileHelper.safeReadFileSync(sourceFile, {
		jsonParse: false,
	});
	if (success) {
		const transpiledCode = env.encryptionSignature + (await getTranspiledData(data.toString(), { compact: true }));
		const encrypted = CryptoJS.AES.encrypt(transpiledCode, env.encryptionKey).toString();
		console.log('byte code of encrypted: ' + getStringByteCount(encrypted));

		const destinationPath = `${baseTargetPath}/${filename}.js`;
		fileHelper.writeToFile(destinationPath, encrypted, { jsonStringify: false, append: false, overwrite: true });
		console.log('created encrypted code.js file at ' + destinationPath);

		//for debugging, we can check the decrypted code here that is not compacted
		const transpiledCodeNotCompact = await getTranspiledData(data.toString());
		const encryptedCodeNotCompact = CryptoJS.AES.encrypt(transpiledCodeNotCompact, env.encryptionKey).toString();
		const decrypted = CryptoJS.AES.decrypt(encryptedCodeNotCompact, env.encryptionKey);
		const decryptedCode = decrypted.toString(CryptoJS.enc.Utf8);
		fileHelper.writeToFile(`${baseTargetPath}/__ignore_decrypted_${filename}.js`, decryptedCode, {
			jsonStringify: false,
			append: false,
			overwrite: true,
		});
		console.log('byte code of decrypted: ' + getStringByteCount(decryptedCode));
	}
}
