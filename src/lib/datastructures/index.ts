/**********************************************************************************
Jewan's queue data structure
**********************************************************************************/
function NDeque(cap: number) {
  let capacity: number = cap;
  let size: number = 0;

  let front: number = 0;
  let back: number = 0;

  let array: any[] = new Array(cap);
  this.list = array;

  this.Capacity = function() {
    return capacity;
  };

  this.Size = function() {
    return size;
  };

  this.GetAt = function(n) {
    if (n >= size) throw new Error('out of range');
    return array[(front + n) % capacity];
  };

  this.SetAt = function(n, val) {
    if (n >= size) throw new Error('out of range');
    array[(front + n) % capacity] = val;
  };

  this.PushFront = function(val) {
    if (size === 0) {
      array[0] = val;
      front = 0;
      back = 1;
      size = 1;
      return;
    }
    if (size === capacity) throw new Error('full');
    --front;
    if (front < 0) front = capacity - 1;
    array[front] = val;
    ++size;
    //console.log("push front(size: " + size + ", val: " + val + ")");
  };

  this.PushBack = function(val) {
    if (size === 0) {
      array[0] = val;
      front = 0;
      back = 1;
      size = 1;
      return;
    }
    if (size == capacity) throw new Error('full');
    array[back++] = val;
    if (back === capacity) back = 0;
    ++size;
    //console.log("push back(size: " + size + ", val: " + val + ")");
  };

  this.PopFront = function() {
    if (size === 0) throw new Error('empty');
    let val = array[front];
    array[front++] = null;
    if (front === capacity) front = 0;
    --size;
    //console.log("pop front!! " + val);
    return val;
  };

  this.PopBack = function() {
    if (size === 0) throw new Error('empty');
    --back;
    if (back < 0) back = capacity - 1;
    let val = array[back];
    array[back] = null;
    --size;
    //console.log("pop back!! " + val);
    return val;
  };

  this.Front = function() {
    if (size === 0) throw new Error('empty.');
    return array[front];
  };

  this.Back = function() {
    if (size === 0) throw new Error('empty.');
    if (back > 0) return array[back - 1];
    else return array[capacity - 1];
  };
}
