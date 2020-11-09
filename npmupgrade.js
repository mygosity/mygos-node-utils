const package = require('./package.json');

function logSpawnOutput(child) {
	let scriptOutput = '';

	child.stdout.setEncoding('utf8');
	child.stdout.on('data', function(data) {
		//Here is where the output goes

		console.log('stdout: ' + data);

		data = data.toString();
		scriptOutput += data;
	});

	child.stderr.setEncoding('utf8');
	child.stderr.on('data', function(data) {
		//Here is where the error output goes

		console.log('stderr: ' + data);

		data = data.toString();
		scriptOutput += data;
	});

	child.on('close', function(code) {
		//Here you can get the exit code of the script

		console.log('closing code: ' + code);

		console.log('Full output of script: ', scriptOutput);
	});
}

async function upgradeDevDependencies(spawn, devDependencies, options) {
	return new Promise((resolve, reject) => {
		if (devDependencies.length) {
			const command = 'npm i --save-dev ' + devDependencies;
			console.log(command);
			if (options?.justPrintCommand) {
				return resolve(command);
			}
			const child = spawn.exec(command, function(err) {
				if (err) {
					return reject(err);
				}
				resolve();
			});
			logSpawnOutput(child);
		} else {
			resolve();
		}
	});
}

async function upgradeDependencies(spawn, dependencies, options) {
	return new Promise((resolve, reject) => {
		if (dependencies.length) {
			const command = 'npm i ' + dependencies;
			console.log(command);
			if (options?.justPrintCommand) {
				return resolve(command);
			}
			const child = spawn.exec(command, function(err) {
				if (err) {
					return reject(err);
				}
				resolve();
			});
			logSpawnOutput(child);
		} else {
			resolve();
		}
	});
}

async function autoUpgradePackages() {
	const spawn = require('child_process');
	const devDependencies = Object.keys(package.devDependencies).join(' ');
	const dependencies = Object.keys(package.dependencies).join(' ');

	try {
		await upgradeDevDependencies(spawn, devDependencies, { justPrintCommand: true });
	} catch (err) {
		console.log(err);
	}

	try {
		await upgradeDependencies(spawn, dependencies, { justPrintCommand: true });
	} catch (err) {
		console.log(err);
	}
}

autoUpgradePackages();
