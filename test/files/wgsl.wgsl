// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

/*
 * A minimal shader: draws a full screen triangle
 * @vertex vs_main
 * @fragment fs_main
 */

struct VertexOutput {
  @builtin(position) position: vec4f, // clip space
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  var out: VertexOutput;
  let uv = vec2f(f32((index << 1u) & 2u), f32(index & 2u)); /* 0..2 */
  out.position = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  // Just the coordinates as a colour
  return vec4f(in.uv, 0.0, 1.0);
}
