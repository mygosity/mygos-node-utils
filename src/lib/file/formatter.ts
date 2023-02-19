import fs, { Stats } from 'fs';
import prettier, { BuiltInParserName } from 'prettier';
import fileHelper from './index';
import utils from '../common';

export function getAllFilesFromDirectory(baseDir: string, ext: string, options: { excludeDirectories?: string[] } = {}): any[] {
	//index all json files for prettying up
	const files = fs.readdirSync(baseDir);
	const fileCollection = [];
	const directories = [];
	const _latestFileSearcher = (baseDir: string, directories: Array<{ path: string; stats: Stats }>, fileCollection) => {
		return (currentFileName) => {
			if (options.excludeDirectories) {
				const [first, lastDirectory] = utils.splitInReverseByCondition(
					baseDir.substring(0, baseDir.length - 1),
					(i: string) => i === '/'
				);
				if (options.excludeDirectories.includes(lastDirectory)) {
					return;
				}
			}
			const stats = fs.statSync(baseDir + currentFileName);
			if (stats.isDirectory()) {
				directories.push({ path: baseDir + currentFileName, stats });
				directories.sort((a, b) => {
					//@ts-ignore
					return b.stats.mtime - a.stats.mtime;
				});
			} else {
				if (currentFileName.indexOf(ext) !== -1) {
					fileCollection.push({
						path: baseDir + currentFileName,
						stats,
					});
					fileCollection.sort((a, b) => {
						return b.stats.mtime - a.stats.mtime;
					});
				}
			}
		};
	};
	files.map(_latestFileSearcher(baseDir, directories, fileCollection));
	while (directories.length) {
		const currentDir = directories.pop();
		const files = fs.readdirSync(currentDir.path);
		files.map(_latestFileSearcher(currentDir.path + '/', directories, fileCollection));
	}
	console.log({
		len: fileCollection.length,
	});
	return fileCollection;
}

export function prettyFormat(files: Array<{ path: string; stats: Stats }>, parser: BuiltInParserName = 'json') {
	for (let i = 0; i < files.length; ++i) {
		const { path } = files[i];
		let readData: string, data: string;
		try {
			readData = JSON.stringify(fileHelper.readFileSync(path));
			data = prettier.format(readData, { parser });
			fileHelper.writeToFile(path, data, { overwrite: true, append: false });
		} catch (error) {
			console.log({
				path,
				readData,
				data,
			});
		}
	}
}
