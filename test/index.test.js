const diff = require('../index');
const fromArray = require('read-stream/array');
const through = require('through');

const toArray = function (stream) {
  const arr = [];

  let data = null;
  let error = null;

  const promise = new Promise((resolve, reject) => {
    data = resolve;
    error = reject;
  })

  stream.pipe(through(
    (chunk) => {
      arr.push(chunk);
    },
    (err) => {
      if (err) {
        error(err)
      } else {
        data(arr);
      }
    }));
  return promise;
};

test('lex order 1', (done) => {
  const arr1 = ['aaa', 'bbb', 'ccc', 'ccc'];
  const arr2 = ['aaa', 'baa', 'bba', 'bbb', 'caa', 'cba', 'cbb', 'cbc'];
  const stream1 = fromArray(arr1);
  const stream2 = fromArray(arr2);
  toArray(diff(stream1, stream2)).then(data => {
    expect(data).toEqual(arr2.filter(x => !arr1.includes(x)));
    done();
  })
});

test('lex order 2', (done) => {
  const arr1 = ['aaa', 'bbb', 'ccc', 'ddd'];
  const arr2 = ['aaa', 'ddd'];
  const stream1 = fromArray(arr1);
  const stream2 = fromArray(arr2);
  toArray(diff(stream1, stream2)).then(data => {
    expect(data).toEqual([]);
    done();
  })
});

test('obj field 1', (done) => {
  const arr1 = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  const arr2 = [{ id: 1 }, { id: 5 }];
  const stream1 = fromArray(arr1);
  const stream2 = fromArray(arr2);
  toArray(diff(stream1, stream2, 'id')).then(data => {
    expect(data).toEqual([]);
    done();
  })
});

test('obj field 2', (done) => {
  const arr1 = [{ id: 1 }, { id: 5 }];
  const arr2 = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  const stream1 = fromArray(arr1);
  const stream2 = fromArray(arr2);
  toArray(diff(stream1, stream2, 'id')).then(data => {
    expect(data).toEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
    done();
  })
});

test('func comp', (done) => {
  const arr1 = [{ id: 1 }, { id: 5 }];
  const arr2 = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  const stream1 = fromArray(arr1);
  const stream2 = fromArray(arr2);
  toArray(diff(stream1, stream2, (a, b) => a['id'] === b['id'] ? 0 : a['id'] > b['id'] ? 1 : -1)).then(data => {
    expect(data).toEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
    done();
  })
});
