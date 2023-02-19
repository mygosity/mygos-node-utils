// https://leetcode.com/problems/substring-with-concatenation-of-all-words/discuss/?currentPage=1&orderBy=most_relevant&query=aho
// https://leetcode.com/problems/stream-of-characters/discuss/279084/simple-implementation-of-aho-corasick-algorithm
#include <vector>
#include <iostream>
#include <string>
#include <algorithm>
#include <queue>

using namespace std;

class StreamChecker {
public:
    StreamChecker(const vector<string>& words) {
        initialize_trie(words);
        build_dictionary_automaton();

    }

    bool query(char letter) {
        current = nodes[current].next[letter - 'a'];
        return nodes[current].terminal;
    }

private:

    int current;

    void build_dictionary_automaton()
    {
        queue<pair<int, int>> Q;
        for (int i = 0; i < ALPHABET_SIZE; ++i)
        {
            if (nodes[root].next[i] == -1)
            {
                nodes[root].next[i] = root;
            }
            else
            {
                Q.push(make_pair(root, nodes[root].next[i]));
            }
        }
        while (!Q.empty())
        {
            auto p = Q.front();
            Q.pop();

            if (nodes[p.first].terminal)
            {
                nodes[p.second].terminal = true;
            }
            for (int i = 0; i < ALPHABET_SIZE; ++i)
            {
                int x = nodes[p.first].next[i];
                int y = nodes[p.second].next[i];
                if (y == -1)
                {
                    nodes[p.second].next[i] = x;
                }
                else
                {
                    Q.push(make_pair(x, y));
                }
            }
        }
        current = 0;
    }

    void initialize_trie(const vector<string>& words)
    {
        root = 0;
        nodes.push_back(TrieNode());
        for (auto& word : words)
        {
            auto current = root;
            for (char c : word)
            {
                int offset = c - 'a';
                if (nodes[current].next[offset] == -1)
                {
                    nodes[current].next[offset] = nodes.size();
                    nodes.push_back(TrieNode());
                }
                current = nodes[current].next[offset];
            }
            nodes[current].terminal = true;
        }
    }

    static const int ALPHABET_SIZE = 26;

    struct TrieNode
    {
        int next[ALPHABET_SIZE];
        bool terminal;
        TrieNode()
        {
            fill(next, next + ALPHABET_SIZE, -1);
            terminal = false;
        }
    };

    vector<TrieNode> nodes;
    int root;

};

static const int accelerate = []() {  
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  return 0;
}();

/**
 * Your StreamChecker object will be instantiated and called as such:
 * StreamChecker* obj = new StreamChecker(words);
 * bool param_1 = obj->query(letter);
 */


/**
 * 
 * 
 * 
 * 
 * 
 * 
 */
// https://leetcode.com/problems/stream-of-characters/discuss/1377982/aho-corasick-implementation-with-trie

class TrieNode{
        public:
  TrieNode *adj[26];
  TrieNode *failure;
    bool isEnd;

    TrieNode() {
        for(int i = 0;i<26;i++){
            adj[i]=NULL;
            failure = NULL;
            isEnd=false;
        }
    }
};
void insert(TrieNode *root, string s){
    TrieNode *tmp = root;
    for(char c : s) {
        if(tmp->adj[c-'a']==NULL){
            tmp->adj[c-'a'] = new TrieNode();
        }
        tmp = tmp->adj[c-'a'];
    }
    tmp->isEnd = true;
}

void build(TrieNode *root) {
    root->failure = root;
    queue<TrieNode*> q;
    for(int i = 0;i<26;i++){
        if(root->adj[i]!=NULL){
            root->adj[i]->failure = root;
            q.push(root->adj[i]);
        }else{
            root->adj[i] = root;
        }
    }
    while(!q.empty()) {
        TrieNode* u = q.front();
        q.pop();
        for(int i = 0;i<26;i++) {
            if(u->adj[i]!=NULL) {
                TrieNode *failure = u->failure;
                while(failure->adj[i]==NULL){
                    failure = failure->failure;
                }
                failure = failure->adj[i];
                u->adj[i]->failure = failure;
                u->adj[i]->isEnd = u->adj[i]->isEnd || failure->isEnd;
                q.push(u->adj[i]);
            }
        }
    }
}
class StreamChecker {
public:
    TrieNode *root;
    TrieNode *curr;
    StreamChecker(vector<string>& words) {
        root = new TrieNode();
        for(string s:words){
            insert(root,s);
        }
        build(root);
        curr = root;
    }
    
    bool query(char letter) {
        
        while(curr->adj[letter-'a']==NULL)
            curr = curr->failure;
        curr = curr->adj[letter-'a'];
        return curr->isEnd;
    }
};

/**
 * Your StreamChecker object will be instantiated and called as such:
 * StreamChecker* obj = new StreamChecker(words);
 * bool param_1 = obj->query(letter);
 */