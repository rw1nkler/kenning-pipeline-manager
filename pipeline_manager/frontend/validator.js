/*
 * Copyright (c) 2022-2023 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Functionality used as a node script to validate specification and dataflows
 * without having to run the application in a browser.
 *
 * Returns:
 * - 0 if validation was successful
 * - 1 if specification was invalid
 * - 2 if dataflow was invalid
 * - 3 if input was invalid
 */

/* eslint-disable */
import fs from 'fs';
import { parseArgs } from "node:util";
import EditorManager from './src/core/EditorManager.js';

const {
  values,
  positionals,
} = parseArgs({
    allowPositionals: true,
    options: {
        help: {
            type: "boolean",
            short: "h",
        },
        resolvedSpecification: {
            type: "string",
        }
    },
});

console.warn = function() {}; // Suppressing baklavajs logging

function printHelp() {
    console.log(
        'Pass a specification path and optional arguments\n\n' +
        'node validator.js specification_path.json [dataflow_path.json] [--resolvedSpecification resolved_spec_path.json]'
    )
}

if (values.h) {
    printHelp();
    process.exit(0);
}

if (positionals.length === 0) {
    printHelp();
    process.exit(3);
}


fs.readFile(positionals[0], async function (err, spec) {
    const instance = EditorManager.getEditorManagerInstance();
    let validationError = instance.validateSpecification(spec.toString());
    if (Array.isArray(validationError) && validationError.length) {
        console.log('Specification errors:')
        validationError.forEach((error) => console.log(`* \t\x1b[31m${error}\x1b[0m`))
        console.log('\x1b[31mSpecification invalid.\x1b[0m');
        process.exit(1);
    }

    let { errors, warnings } = instance.updateEditorSpecification(spec.toString());
    if (Array.isArray(warnings) && warnings.length) {
        console.log('Specification warnings:')
        warnings.forEach((warning) => console.log(`* \t\x1b[33m${warning}\x1b[0m`))
    }
    if (Array.isArray(errors) && errors.length) {
        console.log('Specification errors:')
        errors.forEach((error) => console.log(`* \t\x1b[31m${error}\x1b[0m`))
        console.log('\x1b[31mSpecification invalid.\x1b[0m');
        process.exit(1);
    }
    console.log('\x1b[32mSpecification valid.\x1b[0m');

    if (values.resolvedSpecification) {
        // Write resolved specification in a human-readable format
        fs.writeFileSync(values.resolvedSpecification, JSON.stringify(instance.currentSpecification, null, 4));
    }

    if (positionals.length >= 2) {
        console.log('\n-----\n')
        fs.readFile(positionals[1], async function (err, dataflow) {

            ({ errors, warnings } = await instance.loadDataflow(dataflow.toString()));
            if (Array.isArray(warnings) && warnings.length) {
                console.log('Dataflow warnings:')
                warnings.forEach((warning) => console.log(`* \t\x1b[33m${warning}\x1b[0m`))
            }
            if (Array.isArray(errors) && errors.length) {
                console.log('Dataflow errors:')
                errors.forEach((error) => console.log(`* \t\x1b[31m${error}\x1b[0m`))
                console.log('\x1b[31mDataflow invalid.\x1b[0m');
                process.exit(2);
            }
            console.log('\x1b[32mDataflow valid.\x1b[0m');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
