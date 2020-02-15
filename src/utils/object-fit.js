export function cover (parentWidth, parentHeight, childWidth, childHeight, scale = 1, offsetX = 0.5, offsetY = 0.5) {
  const childRatio = childWidth / childHeight;
  const parentRatio = parentWidth / parentHeight;
  let width = parentWidth * scale;
  let height = parentHeight * scale;

  if (childRatio < parentRatio) {
    height = width / childRatio;
  } else {
    width = height * childRatio;
  }

  return {
    width,
    height,
    offsetX: (parentWidth - width) * offsetX,
    offsetY: (parentHeight - height) * offsetY
  };
}

export function contain (parentWidth, parentHeight, childWidth, childHeight, scale = 1, offsetX = 0.5, offsetY = 0.5) {
  const childRatio = childWidth / childHeight;
  const parentRatio = parentWidth / parentHeight;
  let width = parentWidth * scale;
  let height = parentHeight * scale;

  if (childRatio > parentRatio) {
    height = width / childRatio;
  } else {
    width = height * childRatio;
  }

  return {
    width,
    height,
    offsetX: (parentWidth - width) * offsetX,
    offsetY: (parentHeight - height) * offsetY
  };
}
