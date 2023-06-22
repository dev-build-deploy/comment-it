/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: CC0-1.0
*/

const a = 1; /* Strange comment */ // It really is!

/**
 * This is a Fake interface
 * @interface IFakeInterface
 * @member foo Foo
 * @member bar Bar
 * @internal
 */
interface IFakeInterface {
  foo: string;
  bar: number;
}

/**
 * This does it
 * @function doIt
 * @param foobar 
 * 
 * // TODO: Do something with foobar.foo
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doIt(foobar: IFakeInterface) {
  // For now, we are just going to log it
  // However, we intend to implement a bit
  // logic later onwards
  console.log(foobar.foo); // TODO: Do something with foobar.foo
  
  /* This is the end of the function */
}
