import re

with open('docs/assets/BlankFormsManager-9T2xyd-A.js', 'r') as f:
    c = f.read()

start_ka = c.find('ka=({isOpen:m,onClose:n,onSave:l})=>')
pos_next = c.find(',qt=""+\nnew URL' if ',qt=""+\nnew URL' in c else ',qt=""+\nnew URL' in c and ',qt=""+\nnew URL' or ',qt=""+\nnew URL')
if pos_next == -1:
    pos_next = c.find(',qt=""+\nnew URL("redsea-cm-logo' if ',qt=""+\nnew URL("redsea-cm-logo' in c else ',qt=""+\nnew URL("redsea-cm-logo')
if pos_next == -1:
    pos_next = c.find(',qt=""+\nnew URL')
if pos_next == -1:
    pos_next = c.find(',qt=""+\nnew URL("redsea-cm-logo')
if pos_next == -1:
    pos_next = c.find(',qt=""')

print("Found start_ka at:", start_ka, "pos_next at:", pos_next)
