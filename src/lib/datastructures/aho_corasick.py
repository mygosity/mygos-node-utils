from typing import List
from queue import Queue

print(f"Identifier->{__name__}")


def main():
    # https://www.youtube.com/watch?v=g_wlZ9IhbTs
    # src on why this should be done
    print("This is an importable data structure. The aho-corasick automaton.")


if __name__ == "__main__":
    main()


class AhoCorasick:
    class InternalTrie:
        def __init__(self):
            self.suffixLink = None
            self.id = -1
            self.next = {}

    def __init__(self, words: List[str] = []):
        self.initWords(words)

    def initWords(self, words):
        self.root = self.InternalTrie()
        self.words = words
        self.uniqueIds = 0

        for word in words:
            p = self.root

            for c in word:
                if c not in p.next:
                    p.next[c] = self.InternalTrie()
                p = p.next.get(c)

            if p.id == -1:
                p.id = self.uniqueIds
                self.uniqueIds += 1

        self.buildAutomata()

    def buildAutomata(self):
        q = Queue()
        for c, node in self.root.next.items():
            q.put(node)
            node.suffixLink = self.root

        while not q.empty():
            curr = q.get(0)
            for c, node in curr.next.items():
                ptr = curr.suffixLink
                while ptr is not None and c not in ptr.next:
                    ptr = ptr.suffixLink

                node.suffixLink = ptr.next.get(c) if ptr is not None and c in ptr.next else self.root
                if node.suffixLink.id != -1:
                    node.id = node.suffixLink.id

                q.put(node)

    def findMatches(self, target: str) -> dict:
        matchMap = {}
        ptr = self.root
        for i in range(len(target)):
            c = target[i]

            while ptr is not None and c not in ptr.next:
                ptr = ptr.suffixLink
            ptr = ptr.next.get(c) if ptr is not None and c in ptr.next else self.root

            if ptr.id != -1:
                matchMap[i] = self.words[ptr.id]

        return matchMap

    def printRoot(self) -> None:
        print("printRoot:: start **********")
        q = Queue()
        q.put([self.root, ''])
        words = []
        while not q.empty():
            curr, currStr = q.get(0)
            if curr.id != -1:
                words.append(currStr)
            for c, node in curr.next.items():
                print(f"c: {c} nodeId: {node.id}")
                q.put([node, currStr + c])

        print(words)
        print("printRoot:: end ********** ")
