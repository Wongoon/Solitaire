(function () {

    function Controller() {
        let models = null;

        this.init = function (model) {
            models = model;

            this.cardRender();
            window.addEventListener('click', this.cardDraw);
            window.addEventListener('click', this.cardMove);
            window.addEventListener('click', this.cardCollect);
            window.addEventListener('click', this.restart);
            window.addEventListener('click', this.autoComplete);
        }

        this.restart = function(ev){
            const target = ev.target;
            if(target.id != 'restart') return;
            models.restart(target);
        }

        this.autoComplete = function (ev) {
            const target = ev.target;
            if(target.id != 'auto') return;
            models.autoComplete(target);
        }

        this.cardRender = function () {
            models.cardRender();
        }

        this.cardMove = function (ev) {
            const target = ev.target;
            if(target.classList.contains('back')) return;
            if(!target.classList.contains('card')) return;
            if(!target.parentNode.classList.contains('stacking')) return;
            
            models.cardMove(target);
        }

        this.cardCollect = function (ev) {
            const target = ev.target;
            if(target.classList.contains('back')) return;
            if(!target.classList.contains('card')) return;
            if(!target.parentNode.classList.contains('stacking') || target.parentNode.lastElementChild != target) return;

            models.cardCollect(target);
        }

        this.cardDraw = function (ev) {
            const target = ev.target;
            if(!target.classList.contains('card') || !target.parentNode.classList.contains('stock')) return;

            models.cardDraw(target);
        }
    }

    function Model() {
        const cardStock = [];
        const cardPlaying = Array.from(new Array(7), () => []);
        const cardStack = Array.from(new Array(4), () => []);
        let views = null;
        let parts = null;
        let total = 0;
        const score = 1;
        let isCombo = 0;
        let moved = 0;

        Model.count = 0;
        Model.selectBundle = [];

        this.init = function (view) {
            views = view;
            parts = views.getParts();

            this.cardSettings();
        }

        this.autoComplete = function () {
            let idx = 0;
            let noStackCount = 0;
            while(cardPlaying.filter(col=>col.length>0).length > 0){
                if(idx==7){
                    idx = 0;
                }
                
                const col = cardPlaying[idx];
                const last = col[col.length-1];
                if(col.length>0) {
                    const suitId = parts.card.suits.indexOf(last.$suit);
                    if(cardStack[suitId].length>0){
                        const stackLast = cardStack[suitId].slice(-1)[0];
                        if(last.$suit == stackLast.$suit && last.deno == stackLast.deno+1){
                            console.log(`?????? ${last.deno}|${last.$suit} -> ${stackLast.deno}|${stackLast.$suit}`);
                            const poped = col.pop();
                            poped.isStaged = true;
                            poped.isBack = false;
                            cardStack[suitId].push(poped);
                            noStackCount = 0;
                        } else {
                            noStackCount += 1;
                        }
                    } else {
                        if(last.deno == 1){
                            const poped = col.pop();
                            poped.isStaged = true;
                            poped.isBack = false;
                            cardStack[suitId].push(poped);
                            noStackCount = 0;
                        } else {
                            noStackCount += 1;
                        }
                    }
                }

                idx++;
        
                if(noStackCount>14){
                    this.initSelectedCard();
                    this.autoBackFlip();
                    views.cardRender(cardStock, cardPlaying, cardStack, total, moved);
                    break;
                }
            }

            if(cardPlaying.filter(col=>col.length>0).length>0){
                console.log('??????')
            } else {
                console.log('??????')
            }
            this.initSelectedCard();
            this.autoBackFlip();
            views.cardRender(cardStock, cardPlaying, cardStack, total, moved);
        }

        this.restart = function (target) {
            Model.count = 0;
            this.cardSettings();
            total = 0;
            moved = 0;
            isCombo = 0;
            this.cardRender();
            views.restart(target);
        }

        this.cardSettings = function () {
            this.initCardSetting();
            this.generateCardSuits(parts.card);
            this.shuffleCard();
            this.handOutCard();
        }

        this.initCardSetting = function(){
            while(cardStock.length>0){
                cardStock.pop();
            }
            while(cardPlaying.length>0){
                cardPlaying.pop();
            }
            while(cardStack.length>0){
                cardStack.pop();
            }

            cardPlaying.push(...Array.from(new Array(7), () => []));
            cardStack.push(...Array.from(new Array(4), () => []));
        }

        this.generateCardSuits = function ({
            suits,
            list
        }) {
            [...suits].forEach(type => {
                return [...list].forEach(num => {
                    cardStock.push({
                        id: Model.count++,
                        $suit: type,
                        deno: num,
                        imgSuit: num>10?type+2:type,
                        imgNum: num==1?'ace':num==11?'jack':num==12?'queen':num==13?'king':num,
                        shape: parts.card.shape[type],
                        isBack: true, 
                        isStaged: false,
                        isSelected: false,
                        $parent: cardStock,
                    });
                });
            });
        }

        this.shuffleCard = function () {
            for (let card in cardStock) {
                let random = parseInt(Math.random() * cardStock.length);
                let tmp = cardStock[random];
                cardStock[random] = cardStock[card];
                cardStock[card] = tmp;
            }
        }

        this.handOutCard = function () {
            for (let col = 0; col < 7; col++) {
                for (let row = 0; row <= col; row++) {
                    const last = cardStock.pop();
                    cardPlaying[col].push(last);
                    last.$parent = cardPlaying;
                    last.isStaged = true;
                }
                cardPlaying[col].slice(-1).pop().isBack = false;
            }
        }

        this.cardRender = function () {
            this.autoBackFlip();
            const isAutoComplete = this.checkAutoComplete();
            console.log(isAutoComplete?'?????? ?????? ??????':'?????? ?????? ??????');
            views.cardRender(cardStock, cardPlaying, cardStack, total, moved, isAutoComplete);
        }

        this.autoBackFlip = function () {
            cardPlaying.forEach(col=>{
                if(col.length>0) col[col.length-1].isBack = false;
            });
        }

        this.cardMove = function (elCard) {
            const isLast = [...elCard.parentNode.children].slice(1);
            if(Model.selectBundle.length==0 && !elCard.classList.contains('front')) return;
            if(elCard.closest('.stock') && isLast[isLast.length-1] != elCard) return;
            this.cardSelecter(elCard);

            this.cardRender();
        }
        
        this.cardSelecter = function (elCard) {
            const card = this.findCard(elCard);
            const parent = elCard.parentNode;
            const col = [...parent.parentNode.children].indexOf(parent);
            const idx = [...parent.children].indexOf(elCard);
            const pick = {
                idx: idx,
                card: card,
            };
            if(!card && parent.parentNode.classList.contains('row')) {
                this.cardMoveToEmpty(Model.selectBundle.pop(), col, idx);
                this.initSelectedCard();
                return ;
            } else if(!card && !parent.parentNode.classList.contains('row')){
                this.initSelectedCard();
                return ;
            }
            
            if(card.$parent[0] instanceof Array) Object.assign(pick, {
                col: col
            })
            
            if(!this.validBundle(card)) {
                this.initSelectedCard();
                return;
            }
            
            pick.card.isSelected = true;
            
            Model.selectBundle.push(pick);

            if(Model.selectBundle.length==2){
                const first = Model.selectBundle.shift();
                const second = Model.selectBundle.shift();
                const firstCol = first.card.$parent[first.col];
                const secondCol = second.card.$parent[second.col];
                console.log(first, second)
                console.log(firstCol, secondCol)
                if(secondCol==undefined) {
                    console.log('1')
                    this.initSelectedCard();
                    return;
                }
                
                if(this.isStackable([first.card, second.card])){
                    const temp = [];
                    console.log(2)
                    if(first.card.$parent[0] instanceof Array){
                        for(let i=firstCol.length; i>0; i--){
                            if(i>=first.idx) {
                                const last = firstCol.pop();
                                last.$parent = second.card.$parent;
                                temp.push(last);
                            }
                        }
                        console.table(temp)
                        total += score;
                    } else {
                        console.log(4)
                        const last = first.card.$parent.splice(first.card.$parent.indexOf(first.card), 1).pop();
                        last.$parent = second.card.$parent;
                        total += score;
                        temp.push(last);
                    }
                    moved++;
                    temp.reverse();
                    
                    secondCol.push(...temp);
                } else {
                    if(Model.selectBundle[0] == Model.selectBundle[1]){
                        console.log('?????? ??????');
                    } else {
                        isCombo = 0;
                        console.log('?????????');
                    }
                }
                this.initSelectedCard();
            }
        }

        this.cardMoveToEmpty = function (card, col, idx) {
            if(card.card.deno!=13) return;
            const temp = [];
            const cardCol = card.card.$parent[card.col];
            if(card.card.$parent[0] instanceof Array){
                for(let i=cardCol.length; i>0; i--){
                    if(i>=card.idx) {
                        const last = cardCol.pop();
                        last.$parent = cardPlaying;
                        temp.push(last);
                    }
                }
            } else {
                const last = card.card.$parent.splice(card.card.$parent.indexOf(card.card), 1).pop();
                last.$parent = cardPlaying;
                temp.push(last);
            }
            temp.reverse();

            cardPlaying[col].push(...temp);
            moved++;
        }

        this.validBundle = function (card) {
            const temp = [];
            if(card.$parent[0] instanceof Array){
                for(let col of card.$parent){
                    const idx = col.indexOf(card);
                    if(idx>-1){
                        temp.push(...col.slice(idx));
                        break;
                    }
                }
            } else {
                temp.push(card.$parent.filter(card=>card.isStaged).shift());
            }

            if(temp.length>1){
                temp.forEach(card=>card.isSelected=true);
                return this.isCascade(temp.reverse());
            } else {
                return true;
            }
        }

        this.isCascade = function(validList){
            for(let card=0; card<validList.length-1; card++){
                if(this.isStackable([validList[card], validList[card+1]])){
                    continue;
                } else {
                    return false;
                }
            }
            return true;
        }

        this.isStackable = function ([first, second]) {
            if(parseInt(first.deno)+1 == parseInt(second.deno) && this.isCrossable(first.$suit, second.$suit)){
                return true;
            } else {
                return false;
            }
        }

        this.isCrossable = function (first, second) {
            const isLeft = (type) => parts.card.suits.slice(0,2).indexOf(type)>-1;
            const isRight = (type) => parts.card.suits.slice(2).indexOf(type)>-1;

            return (isLeft(first) && isRight(second)) || (isRight(first) && isLeft(second));
        }

        this.initSelectedCard = function () {
            Model.selectBundle = [];
            [].concat([...cardStock],[].concat(...cardStack),[].concat(...cardPlaying)).map(card=>{
                card.isSelected = false;
                return card;
            });
        }

        this.cardCollect = function (elCard) {
            const card = this.findCard(elCard);
            if(!card || !this.validNextCard(card)) return ;
            let getCard;
            if(card.$parent[0] instanceof Array){
                for(let col of card.$parent){
                    for(let row of col){
                        if(row == card){
                            getCard = col.splice(card.$parent.indexOf(card), 1).pop();
                            break;
                        }
                    }
                }
            } else {
                getCard = card.$parent.splice(card.$parent.indexOf(card), 1).pop();
            }
            if(!getCard) return;
            
            card.$parent = cardStack;
            cardStack[parts.card.suits.indexOf(card.$suit)].push(getCard);
            isCombo += 1;
            total += score*isCombo;
            moved++;
            this.initSelectedCard();
            this.cardRender();
        }

        this.validNextCard = function(card){
            if(card.deno == 1) return true;
            else if(card.deno == cardStack[parts.card.suits.indexOf(card.$suit)]?.slice(-1)?.pop()?.deno+1) return true;
        }

        this.checkAutoComplete = function () {
            const copyPlaying = [...cardPlaying].map(col=>[...col].map(card=> {
                return {
                    deno: card.deno,
                    $suit: card.$suit
                }
            }))
            const copyStack = [...cardStack].map(col=>[...col].map(card=> {
                return {
                    deno: card.deno,
                    $suit: card.$suit
                }
            }))
            let idx = 0;
            let noStackCount = 0;
            while(copyPlaying.filter(col=>col.length>0).length > 0){
                if(idx==7){
                    idx = 0;
                }
                
                const col = copyPlaying[idx];
                const last = col[col.length-1];
                if(col.length>0) {
                    const suitId = parts.card.suits.indexOf(last.$suit);
                    if(copyStack[suitId].length>0){
                        const stackLast = copyStack[suitId].slice(-1).pop()
                        if(last.$suit == stackLast.$suit && last.deno == stackLast.deno+1){
                            console.log(`?????? ${last.deno}|${last.$suit} -> ${stackLast.deno}|${stackLast.$suit}`);
                            copyStack[suitId].push(col.pop());
                            noStackCount = 0;
                        } else {
                            noStackCount += 1;
                        }
                    } else {
                        if(last.deno == 1){
                            copyStack[suitId].push(col.pop());
                            noStackCount = 0;
                        } else {
                            noStackCount += 1;
                        }
                    }
                }

                idx++;
        
                if(noStackCount>6){
                    return false;
                }
            }
            return true;
        }

        this.cardDraw = function (elStock) {
            const notStaged = cardStock.filter(s=>!s.isStaged);
            for(let card in notStaged){
                if(card == notStaged.length-1){
                    notStaged[card].isStaged = true;
                    notStaged[card].isBack = false;
                }
            }


            this.initSelectedCard(); 
            this.cardRender();
        }

        this.findCard = function (card) {
            return [].concat([...cardStock],[].concat(...cardStack),[].concat(...cardPlaying)).filter(c=>c.id == card.dataset.cardId).pop();
        }
    }

    function View() {
        let parts = null;
        let options = null;
        let elStock = null;
        let elStack = null;
        let elColumns = null;
        let time = 0;
        let loop;

        this.init = function (part) {
            parts = part;

            this.renderFrames();
        }

        this.renderFrames = function () {
            document.body.insertAdjacentHTML('afterbegin', parts.template.frame.render());
            document.body.insertAdjacentHTML('afterbegin', parts.template.option.render());
            
            options = document.querySelector('.title');
            elStock = document.querySelector('.stock');
            elStack = document.querySelector('.stack');
            elColumns = document.querySelector('.ground .row:last-child');

            elStack.insertAdjacentHTML('beforeend', parts.template.stack.render());
            elColumns.insertAdjacentHTML('beforeend', parts.template.play.render());
            
            this.timerOn();
        }

        this.restart = function (target) {
            this.timerOff();
            this.timerOn();
        }

        this.timerOn = function(){
            loop = setInterval(()=>{
                time++;
                let hour = parseInt(time/60/60).toString().padStart(2,0);
                let min = parseInt(time/60).toString().padStart(2,0);
                let sec = (time%60).toString().padStart(2,0);
                document.querySelector('.time').textContent = `${time/60/60>=1?`${hour}:`:''}${min}:${sec}`;
            }, 1000);
        }

        this.timerOff = function(){
            time = -1;
            clearInterval(loop);
        }
        
        this.cardDraw = function (cardStock) {
            this.clearStock(elStock);
            const staged = cardStock.filter(s=>s.isStaged);
            const notStaged = cardStock.filter(s=>!s.isStaged);
            staged.reverse().forEach((s, idx)=>{
                elStock.querySelector('.stacking').insertAdjacentHTML('beforeend', parts.card.render(s));
            });

            [...elStock.querySelector('.stacking').children].slice(1).slice(-3).forEach((el, idx)=>{
                el.style.left = (idx*30)+'px';
            });

            if(notStaged.length==0) elStock.firstElementChild.classList.add('stop');
        }

        this.cardCollect = function (cardStack) {
            this.clearStack(elStack);
            cardStack.forEach(stack=>{
                stack.forEach((s, idx)=>{
                    [...elStack.children][parts.card.suits.indexOf(s.$suit)].insertAdjacentHTML('beforeend', parts.card.render(s));
                });
            });
        }

        this.cardPlaying = function (cardPlay) {
            this.clearPlaying(elColumns);
            for(let col in cardPlay){
                for(let row in cardPlay[col]){
                    [...elColumns.children][col].insertAdjacentHTML('beforeend', parts.card.render(cardPlay[col][row]));
                    [...elColumns.children][col].lastElementChild.style.top = row*20+'px';
                }
            }
        }

        this.cardRender = function (cardStock, cardPlay, cardStack, total, moved, isAutoComplete) {
            this.optionsRender(total, moved);
            this.cardPlaying(cardPlay);
            this.cardCollect(cardStack);
            this.cardDraw(cardStock); 

            if(isAutoComplete){
                this.renderAutoComplete();
            }
        }

        this.renderAutoComplete = function(){
            document.querySelector('.title').insertAdjacentHTML('beforeend', `
                <button id="auto" style="border: none; background: coral; color: white; font-weight: bold; padding: .5rem; border-radius: .5rem; margin-top: 1rem;">
                    Auto Complete
                </button>
            `);
        }

        this.optionsRender = function (total, moved) {
            document.querySelector('.score').innerHTML = total;
            document.querySelector('.moved').innerHTML = moved;
        }

        this.clearPlaying = function (el) {
            el.innerHTML = parts.template.play.render();
        }

        this.clearStack = function (el) {
            el.innerHTML = parts.template.stack.render();
        }

        this.clearStock = function (el) {
            el.innerHTML = parts.template.stock.render();
        }
        
        this.getParts = function () {
            return parts;
        }
    }

    return {
        init() {
            const parts = {
                options: {
                    
                },
                card: {
                    suits: ['spades', 'clubs', 'hearts', 'diamonds'],
                    shape: {
                        spades:'???',
                        clubs: '???',
                        hearts: '???',
                        diamonds: '???',
                    },
                    list: new Array(13).fill(0).map((num, idx) => idx + 1),
                    render(card) {
                        const side = card ?.isBack == undefined ? 'empty' : card.isBack ? 'back' : 'front';
                        return `
                            <div class="card ${side} ${card.isSelected?'active':''}"
                            data-card-id="${card?.id??'-1'}" 
                            data-card-suit="${card?.$suit??'none'}"
                            data-card-deno="${card?.deno??'none'}"
                            style="background-image: url('img/${card.imgNum}_of_${card.imgSuit}.png')">
                            </div>
                        `
                    }
                },
                template: {
                    option: {
                        render(){
                            return `<div class="title" style="margin-bottom: 1em; width: 90%;">
                            <div id="restart" align="center" style="margin-bottom: 1em; font-size: 150%; border: 1px solid white; border-radius: 0.5rem; padding: 1em; user-select: none;">Solitaire</div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>
                                    <span>Score</span>
                                    <span class="score">0</span>
                                </span>
                                <span>
                                    <span>Time</span>
                                    <span class="time">00:00</span>
                                </span>
                                <span>
                                    <span>Moved</span>
                                    <span class="moved">0</span>
                                </span>
                            </div>
                        </div>`;
                        }
                    },
                    stock: {
                        render(){
                            return `
                            <div class="card back"></div>
                            <div class="stacking">
                                <div class="card"></div>
                            </div>
                            `;
                        }
                    },
                    stack: {
                        render(){
                            return `
                            <div class="stacking">
                                <div class="card"></div>
                            </div>
                            <div class="stacking">
                                <div class="card"></div>
                            </div>
                            <div class="stacking">
                                <div class="card"></div>
                            </div>
                            <div class="stacking">
                                <div class="card"></div>
                            </div>
                            `;
                        }
                    },
                    play: {
                        render(){
                            const column = `<div class="stacking">
                                <div class="card"></div>
                            </div>`;
                            return new Array(7).fill(column).join('');
                        }
                    },
                    frame: {
                        render(){
                            return `
                            <div id="app">
                                <div class="ground">
                                    <div class="row">
                                        <div class="stock">
                                        </div>
                                        <div class="stack">
                                        </div>
                                    </div>
                                    <div class="row">
                                    </div>
                                </div>
                            </div>
                            `;
                        }
                    }
                }
            }

            const view = new View();
            const model = new Model();
            const controller = new Controller();

            view.init(parts);
            model.init(view);
            controller.init(model);
        }
    }
})().init();