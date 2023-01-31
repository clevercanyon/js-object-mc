export function merge(obj1:{[x:string|number]:unknown}, obj2:{[x:string|number]:unknown}): {[x:string|number]:unknown};
export function patch(obj1:{[x:string|number]:unknown}, obj2:{[x:string|number]:unknown}): {[x:string|number]:unknown};
export function update(obj1:{[x:string|number]:unknown}, obj2:{[x:string|number]:unknown}): {[x:string|number]:unknown};

export function addOperation(name: string, callback: (current:{[x:string|number]:unknown}, defaults:{[x:string|number]:unknown}) => boolean):
	 undefined | ((current:{[x:string|number]:unknown}, defaults:{[x:string|number]:unknown}) => boolean);
