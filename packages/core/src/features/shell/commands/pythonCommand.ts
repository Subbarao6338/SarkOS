import { Command } from "../command";
import { runPythonCode, runJSCode } from "../pythonRunner";

export const pythonCommand = new Command()
	.setManual({
		purpose: "Execute Python script or inline code in Wasm-backed environment",
		usage: "python [FILE] or python -c \"CODE\"",
		description: "Runs Python code via Wasm Pyodide runtime or inline evaluator backed by VFS.",
		options: {
			"-c": "Specify Python code string to execute directly",
		},
	})
	.addOption({ short: "c", long: "command", isInput: true })
	.setExecute(async function(this: Command, args, { workingDirectory, options, stdout, stderr, shell }) {
		let codeToRun = "";

		const cmdIndex = options.indexOf("c");
		if (cmdIndex !== -1 && args[cmdIndex]) {
			codeToRun = args[cmdIndex];
		} else if (args.length > 0) {
			const filePath = args[0];
			const file = workingDirectory.findFile(filePath);
			if (!file) {
				await stderr.write(`python: ${filePath}: No such file\n`);
				return 1;
			}
			codeToRun = file.content || "";
		} else {
			await stdout.write("Python 3.11.0 (Pyodide Wasm OS)\nType python -c \"code\" or python <file.py> to execute.\n");
			return 0;
		}

		let outputBuffer = "";
		const result = await runPythonCode(codeToRun, (text) => {
			outputBuffer += text;
		});

		if (outputBuffer) {
			await stdout.write(outputBuffer);
		}

		return result.success ? 0 : 1;
	});

export const execCommand = new Command()
	.setManual({
		purpose: "Execute JavaScript/TypeScript code inline or from file",
		usage: "exec [FILE] or exec -c \"CODE\"",
		description: "Executes JavaScript snippets natively within ProzillaOS engine.",
		options: {
			"-c": "Specify JS code string to execute directly",
		},
	})
	.addOption({ short: "c", long: "command", isInput: true })
	.setExecute(async function(this: Command, args, { workingDirectory, options, stdout, stderr }) {
		let codeToRun = "";

		const cmdIndex = options.indexOf("c");
		if (cmdIndex !== -1 && args[cmdIndex]) {
			codeToRun = args[cmdIndex];
		} else if (args.length > 0) {
			const filePath = args[0];
			const file = workingDirectory.findFile(filePath);
			if (!file) {
				await stderr.write(`exec: ${filePath}: No such file\n`);
				return 1;
			}
			codeToRun = file.content || "";
		} else {
			await stderr.write("exec: missing code snippet or file argument\n");
			return 1;
		}

		let outputBuffer = "";
		const result = await runJSCode(codeToRun, (text) => {
			outputBuffer += text;
		});

		if (outputBuffer) {
			await stdout.write(outputBuffer);
		}

		return result.success ? 0 : 1;
	});
